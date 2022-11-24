import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import {GrDownload} from "react-icons/gr";
import {useState} from "react";
import './loading.css';


function download() {
    const url = "http://localhost:8080/youtube/6DZjCgxbx5U";
    fetch(url).then(resp => {console.log(resp); return resp.blob();}).then(blob => {
        console.log(blob);
        const audio_element = document.createElement("audio");
        audio_element.src = URL.createObjectURL(blob)
        audio_element.controls = true;
        document.body.appendChild(audio_element)
    });
}

function App() {
    const [loaded, setLoaded] = useState(false);
    const [id, setId] = useState<string>();

    return (
        <Container>
            <div className="text-center p-3">
                <h1>Youtube Music Downloader</h1>
                <InputGroup className="mb-3" >
                    <InputGroup.Text id="">ID</InputGroup.Text>
                    <Form.Control
                        placeholder=""
                        onChange={e => setId(e.target.value)}
                    />
                    <Button className="pt-1 pb-2" onClick={download}>
                        <div className="icon">
                            <GrDownload className="react-icons" />
                        </div>
                    </Button>
                </InputGroup >
            </div>
        </Container>
    );
}

export default App;
