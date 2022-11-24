use actix_cors::Cors;
use actix_web::{
    http::{self, StatusCode},
    web, App, HttpResponse, HttpServer, Responder,
};
use std::process::Command;

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

    web::block(|| std::fs::remove_file("./tmp.mp3").unwrap())
        .await
        .unwrap();

    HttpResponse::build(StatusCode::OK)
        .content_type("audio/mp3")
        .body(audio)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        let cors = Cors::default()
            .allowed_origin("http://localhost:3000")
            .allowed_methods(vec!["GET", "POST"])
            .allowed_headers(vec![http::header::AUTHORIZATION, http::header::ACCEPT])
            .allowed_header(http::header::CONTENT_TYPE)
            .max_age(3600);

        App::new()
            .wrap(cors)
            .service(web::resource("/youtube/{id}").route(web::get().to(youtube)))
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
