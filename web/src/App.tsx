import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import { MdOutlineTransitEnterexit } from "react-icons/md";
import { AiOutlineDownload } from "react-icons/ai";
import { useEffect, useRef, useState } from "react";
import "./loading.css";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

class MusicData {
    title: string;
    id: string;
    thumbnail: string;

    constructor(title: string, id: string, thumbnail: string) {
        this.title = title;
        this.id = id;
        this.thumbnail = thumbnail;
    }
}

async function searchAudio(keyword: string) {
    const url = "http://localhost:8080" + "/search/" + keyword;
    const response = await fetch(url);

    const data: MusicData[] = await response.json();

    return data;
}

async function downloadMusic(id: string, title: string) {
    const url = "http://localhost:8080/download/" + id;
    const response = await fetch(url);
    const blob = await response.blob();
    const _url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.setProperty("display", "none");
    a.href = _url;
    a.download = title + ".mp3";
    a.click();
    window.URL.revokeObjectURL(url);
}

function SearchFromKeyword() {
    const [keyword, setKeyword] = useState("");
    const [musicList, setMusicList] = useState<MusicData[]>([]);

    const inputElement: React.MutableRefObject<HTMLInputElement | null> =
        useRef(null);
    const buttonElement: React.MutableRefObject<HTMLButtonElement | null> =
        useRef(null);

    useEffect(() => {
        inputElement.current?.addEventListener(
            "keydown",
            (event: { key: string; preventDefault: () => void }) => {
                if (event.key == "Enter") {
                    event.preventDefault();
                    buttonElement.current?.click();
                }
            }
        );
    }, []);

    const items = musicList.map((music: MusicData, index: number) => (
        <Container key={index.toString()}>
            <Card>
                <Row className="align-items-center">
                    <Col md={5} lg={2}>
                        <Card.Img variant="top" src={music.thumbnail} />
                    </Col>
                    <Col md={7} lg={10}>
                        <Card.Body>
                            <Row>
                                <Col md={12} lg={8}>
                                    <Card.Title>{music.title}</Card.Title>
                                </Col>
                                <Col md={12} lg={4}>
                                    <Button
                                        variant="outline-primary"
                                        onClick={() =>
                                            downloadMusic(music.id, music.title)
                                        }
                                    >
                                        Download
                                        <AiOutlineDownload
                                            style={{ margin: "0 0 0 5px" }}
                                        ></AiOutlineDownload>
                                    </Button>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Col>
                </Row>
            </Card>
        </Container>
    ));
    return (
        <>
            <Container>
                <Row>
                    <Col>
                        <InputGroup className="mb-3">
                            <InputGroup.Text id="">Keyword</InputGroup.Text>
                            <Form.Control
                                placeholder=""
                                ref={inputElement}
                                onChange={(e: { target: { value: any } }) =>
                                    setKeyword(e.target.value)
                                }
                            />
                            <Button
                                className="pt-1 pb-2"
                                ref={buttonElement}
                                onClick={async () => {
                                    const newMusicList = await searchAudio(
                                        keyword
                                    );
                                    setMusicList(newMusicList);
                                }}
                            >
                                <MdOutlineTransitEnterexit />
                            </Button>
                        </InputGroup>
                    </Col>
                </Row>
                <Row>
                    <ListGroup>{items}</ListGroup>
                    <Col md={12} className="d-flex justify-content-center">
                        <Loading />
                    </Col>
                </Row>
            </Container>
        </>
    );
}

function Loading() {
    return (
        <div className="lds-facebook">
            <div></div>
            <div></div>
            <div></div>
        </div>
    );
}

function App() {
    return (
        <Container>
            <div className="text-center p-2">
                <h1>Youtube Music Downloader</h1>
                <SearchFromKeyword />
            </div>
        </Container>
    );
}

export default App;
