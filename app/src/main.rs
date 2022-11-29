use actix_cors::Cors;
use actix_web::{
    get,
    http::{self, StatusCode},
    web, App, HttpResponse, HttpServer, Responder,
};
use actix_web_lab::sse::{self, ChannelStream, Sse};
use std::{process::Command, sync::Mutex};

async fn youtube(path: web::Path<String>) -> impl Responder {
    let id = path.into_inner();
    let url = format!("https://www.youtube.com/watch?v={}", id);
    web::block(|| {
        Command::new("yt-dlp")
            .args(["-o", r#"./tmp.mp3"#])
            .arg("-x")
            .args(["--audio-format", "mp3"])
            .arg(url)
            .output()
            .unwrap();
    })
    .await
    .unwrap();

    let audio = web::block(|| std::fs::read("./tmp.mp3").unwrap())
        .await
        .unwrap();

    HttpResponse::build(StatusCode::OK)
        .content_type("audio/mp3")
        .body(audio)
}

pub struct Message {
    inner: Mutex<Vec<sse::Sender>>,
}

impl Message {
    async fn new_client(&self) -> Sse<ChannelStream> {
        let (tx, rx) = sse::channel(10);
        tx.send(sse::Data::new("connected")).await.unwrap();
        self.inner.lock().unwrap().push(tx);
        rx
    }

    async fn broadcast(&self, msg: &str) {
        let clients = self.inner.lock().unwrap();

        let send_futures = clients
            .iter()
            .map(|client| client.send(sse::Data::new(msg)));

        let _ = futures::future::join_all(send_futures).await;
    }
}

async fn stream(msg: web::Data<Message>) -> impl Responder {
    let rx = msg.new_client().await;
    return rx;
}

async fn send_message(path: web::Path<String>, sender: web::Data<Message>) -> impl Responder {
    let msg = path.into_inner();
    sender.broadcast(&msg).await;
    format!("send {}", msg)
}

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
struct MusicData {
    title: String,
    id: String,
    thumbnail: String,
}

impl MusicData {
    fn new(keyword: &str) -> Vec<Self> {
        let mut vec = vec![];

        let output = Command::new("yt-dlp")
            .arg(format!("ytsearch:{}", keyword))
            .args(["--get-title", "--get-thumbnail", "--get-id"])
            .output()
            .unwrap();
        let output = String::from_utf8(output.stdout).unwrap();
        let output = output.split('\n').collect::<Vec<_>>();

        for out in output.chunks(4) {
            vec.push(MusicData {
                title: out[0].to_string(),
                id: out[1].to_string(),
                thumbnail: out[2].to_string(),
            })
        }

        vec
    }
}

async fn search(path: web::Path<String>) -> impl Responder {
    web::Json(MusicData::new(&path.into_inner()))
}

#[get("/download/{id}")]
async fn download(path: web::Path<String>) -> impl Responder {
    let id = path.into_inner();
    println!("{}", id);
    let url = format!("https://www.youtube.com/watch?v={}", id);
    let audio = web::block(|| {
        std::fs::remove_file("./tmp.mp3").ok();
        Command::new("yt-dlp")
            .args(["-o", r#"./tmp.mp3"#])
            .arg("-x")
            .args(["--audio-format", "mp3"])
            .arg(url)
            .output()
            .unwrap();
        std::fs::read("./tmp.mp3").unwrap()
    })
    .await
    .unwrap();

    HttpResponse::build(StatusCode::OK)
        .content_type("audio/mp3")
        .body(audio)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let msg = web::Data::new(Message {
        inner: Mutex::new(Vec::new()),
    });
    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("http://localhost:3000")
            .allowed_methods(vec!["GET", "POST"])
            .allowed_headers(vec![http::header::AUTHORIZATION, http::header::ACCEPT])
            .allowed_header(http::header::CONTENT_TYPE)
            .max_age(3600);

        App::new()
            .app_data(msg.clone())
            .wrap(cors)
            .service(web::resource("/youtube/{id}").route(web::get().to(youtube)))
            .service(web::resource("/search/{keyword}").route(web::get().to(search)))
            .service(web::resource("/stream").route(web::get().to(stream)))
            .service(web::resource("/send/{msg}").route(web::get().to(send_message)))
            .service(download)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
    .unwrap();

    Ok(())
}
