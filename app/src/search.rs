use anyhow::{Context, Result};
use json::JsonValue;
use serde::Serialize;

#[macro_export]
macro_rules! regex {
    ($pattern:expr) => {{
        use once_cell::sync::Lazy;
        use regex::Regex;
        Lazy::new(|| Regex::new($pattern).unwrap())
    }};
}

const YOUTUBE_URL: &str = "https://www.youtube.com";

pub async fn search<T: std::fmt::Display>(search_query: T) -> Result<Vec<Video>> {
    let response = reqwest::get(format!(
        "{}/results?search_query={}&hl=en",
        YOUTUBE_URL, search_query
    ))
    .await?
    .text()
    .await?;

    let data = response
        .split("ytInitialData = '")
        .next()
        .context("html parse failed")?
        .split("';</script>'")
        .next()
        .context("html parse failed")?;

    let data = data.replace(r"\\\\\", "");

    let data = data
        .split(r#"{"itemSectionRenderer":"#)
        .nth(data.split(r#"{"itemSectionRenderer":"#).count() - 1)
        .context("failed parse json")?
        .split(r#"},{"continuationItemRenderer":{"#)
        .next()
        .context("failed parse json")?;

    let data = json::parse(&data)?;
    let mut videos = vec![];

    match &data["contents"] {
        JsonValue::Array(contents) => {
            for content in contents {
                if let Some(video) = parse_video(content) {
                    videos.push(video);
                }
            }
        }
        _ => {
            panic!("not array")
        }
    }

    Ok(videos)
}

#[derive(Debug, Serialize)]
pub struct Video {
    pub id: String,
    pub title: String,
    pub thumbnail: String,
}

fn parse_video(json: &JsonValue) -> Option<Video> {
    if let JsonValue::Object(data) = &json["videoRenderer"] {
        Some(Video {
            title: data["title"]["runs"][0]["text"].to_string(),
            id: data["videoId"].to_string(),
            thumbnail: data["thumbnail"]["thumbnails"][0]["url"].to_string(),
        })
    } else {
        None
    }
}
