import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Card from 'react-bootstrap/Card';
import {MdOutlineTransitEnterexit} from "react-icons/md";
import {AiOutlineDownload} from "react-icons/ai";
import {useEffect, useRef, useState} from "react";
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

    //const decoder = new TextDecoder();
    //const newMusicList: MusicData[] = [];
    //     if (!response.body) {
    //         throw new Error("response body is null");
    //     }
    //     const reader = response.body.getReader();
    //     while (true) {
    //         const {done, value} = await reader.read();

    //         if (done) break;

    //         const ret = document.createElement("p");
    //         const data: MusicData = JSON.parse(decoder.decode(value));
    //         newMusicList.push(data);

    //         document.body.appendChild(ret);
    //     }
    return data[0];
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

    const inputElement: React.MutableRefObject<HTMLInputElement | null> = useRef(null);
    const buttonElement: React.MutableRefObject<HTMLButtonElement | null> = useRef(null);

    useEffect(() => {
        inputElement.current?.addEventListener("keydown", (event) => {
            if (event.key == "Enter") {
                event.preventDefault();
                buttonElement.current?.click();
            }
        });
    }, []);

    const items = musicList.map((music, index) =>
        <li key={index.toString()} style={{listStyleType: "none"}}>

            <Container className="p-0 m-0">
                <Card>
                    <Row className="no-gutters align-items-center">
                        <Col md={3}>
                            <Card.Img variant="top" src={music.thumbnail} />
                        </Col>
                        <Col md={7}>
                            <Card.Body>
                                <Card.Title>{music.title}</Card.Title>
                            </Card.Body>

                        </Col>
                        <Col md={2}>
                            <Button variant="primary" onClick={() => downloadMusic(music.id, music.title)}>
                                <AiOutlineDownload className="react-icons" />
                            </Button>
                        </Col>
                    </Row>

                </Card>
            </Container>

        </li>
    );
    return (
        <>
            <InputGroup className="mb-3">
                <InputGroup.Text id="">Keyword</InputGroup.Text>
                <Form.Control
                    placeholder=""
                    ref={inputElement}
                    onChange={(e) => setKeyword(e.target.value)}
                />
                <Button className="pt-1 pb-2" ref={buttonElement} onClick={async () => {
                    const newMusic = await searchAudio(keyword);
                    setMusicList([newMusic]);
                }}>
                    <div className="icon">
                        <MdOutlineTransitEnterexit className="react-icons" />
                    </div>
                </Button>
            </InputGroup>
            <ul>{items}</ul>
        </>
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
