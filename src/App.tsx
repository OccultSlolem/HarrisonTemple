import {
  Suspense,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { useAsset } from "use-asset";
import "./App.css";

// The aim is to go for the "GIGACHAD" angles, so we'll do the following:
// The meme mostly consists of a camera panning across the model, so we'll keep a list of pairs of positions to interpolate between
// When we get to the end of one pair, we'll move to the next pair
// In addition, a second array will contain the rotation of the camera at each position one-to-one with each pair of positions
// When we get to the end of the pairs list, we loop back to the start

const numSecondsPerPosition = 3;

type PositionPair = [
  [x1: number, y1: number, z1: number],
  [x2: number, y2: number, z2: number]
];
const positionPairs: PositionPair[] = [
  [
    [7.3, 45, 48.7],
    [-2, 45, 52],
  ],
  [
    [0.8, 46.6, 47],
    [1.06, 36.6, 43],
  ],
  [
    [-4.6, 38, 48.5],
    [-1.2, 39, 49.2],
  ],
  [
    [61.8, 1.18, 78.5],
    [48.8, 7.5, 93],
  ],
  [
    [13.3, 51.4, 69.7],
    [17.6, 43.5, 70.6],
  ],
];

type CameraAngle = [x: number, y: number, z: number];
const cameraAngles: CameraAngle[] = [
  [-0.14, 0.0, 0.0126],
  [0.358, 0.21, -0.078],
  [0.5, -0.07, 0.035],
  [0.35, 0.72, -0.235],
  [-0.321, 0.383, 0.12],
];

/**
 * A context that states whether or not the scene has loaded. Mostly works, kind of :3
 */
const SceneContext = createContext<{
  loaded: boolean;
  started: boolean;
  setLoaded: (value: boolean) => void;
  setStarted: (value: boolean) => void;
}>({
  loaded: false,
  started: false,
  setLoaded: () => {},
  setStarted: () => {},
});

/**
 * Loads the Neuro model and returns it as a primitive
 * @returns The Neuro model as a primitive
 */
function Nwero() {
  const context = useContext(SceneContext);
  const gltf = useAsset(async (ready) => {
    const loader = new GLTFLoader();
    if (!ready) return;
    const gltf = await loader.loadAsync("/vtuber_neuro-sama.glb");
    context.setLoaded(true);
    return gltf;
  }, GLTFLoader);

  if (!gltf || !context.loaded) return null;

  return <primitive object={gltf?.scene} />;
}

/**
 * Controls the camera's position and rotation. Must be called in a scene that contains a camera.
 * @param onCameraChange A callback that is called whenever the camera's position or rotation changes
 * @param interruptAnimation Whether or not to interrupt the animation
 * @returns null
 */
function CameraController({
  onCameraChange,
  interruptAnimation,
}: {
  onCameraChange?: (camera: THREE.Camera) => void;
  interruptAnimation?: boolean;
}) {
  const { camera } = useThree();
  const [index, setIndex] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const context = useContext(SceneContext);

  useEffect(() => {
    if (onCameraChange) {
      onCameraChange(camera);
    }
  }, [camera, onCameraChange]);

  useFrame(() => {
    if (interruptAnimation || !context.loaded || !context.started) return;

    const elapsed = (Date.now() - startTime) / 1000; // time elapsed in seconds
    const t = elapsed / numSecondsPerPosition; // normalize to the duration of the animation

    if (t > 1) {
      setIndex((index + 1) % positionPairs.length);
      setStartTime(Date.now());
    } else {
      const currentPair = positionPairs[index];
      const startPos = currentPair[0];
      const endPos = currentPair[1];

      // interpolate between the start and end positions
      const x = startPos[0] * (1 - t) + endPos[0] * t;
      const y = startPos[1] * (1 - t) + endPos[1] * t;
      const z = startPos[2] * (1 - t) + endPos[2] * t;

      camera.position.set(x, y, z);

      // Since the camera always has the same angle in the gigachad meme, we need
      camera.rotation.set(
        cameraAngles[index][0],
        cameraAngles[index][1],
        cameraAngles[index][2]
      );
    }
  });

  return null;
}

/**
 * Controls the audio
 * @returns A button that toggles the audio
 */
function AudioManager() {
  const context = useContext(SceneContext);
  const audioRef = useRef(new Audio("/CanYouFeelMyHeart_LessScuffed.mp3"));

  useEffect(() => {
    const audio = audioRef.current;
    audio.loop = true;
    audio.volume = 0.5;
    audio.load();

    return () => {
      audio.pause();
    };
  }, []);

  useEffect(() => {
    if (context.started) {
      audioRef.current.play();
    }
  }, [context.started]);

  function toggleMute() {
    const audio = audioRef.current;
    if (audio.paused) audio.play();
    else audio.pause();
  }

  return (
    <button className="music-button navbar-button" onClick={toggleMute}>
      Toggle Music
    </button>
  );
}

/**
 * Chrome requires the user to interact with the page before audio can be played, so we'll use this to start the animation.
 * A black screen will be shown until the user clicks the go button.
 */
function Starter({ children }: { children: React.ReactNode }) {
  const context = useContext(SceneContext);

  function start() {
    context.setStarted(true);
  }

  return (
    <>
      {!context.started && (
        <>
          <div className="starter">
            {context.loaded ? (
              <div>
                <button className="starter-button" onClick={start}>
                  <i className="animation"></i>START
                  <i className="animation"></i>
                </button>
              </div>
            ) : (
              <span>Loading...</span>
            )}
            <span className="warning">HEADPHONE WARNING: Loud Music Ahead</span>
          </div>
        </>
      )}

      {children}
    </>
  );
}

/**
 * The main scene
 * @returns The main scene
 */
function SceneCanvas() {
  const [cameraPosition, setCameraPosition] = useState<
    [number, number, number]
  >([0, 0, 0]);
  const [cameraRotation, setCameraRotation] = useState<
    [number, number, number]
  >([0, 0, 0]);

  const [interruptAnimation, setInterruptAnimation] = useState(false);

  function onCameraChange(camera: THREE.Camera) {
    setCameraPosition([
      camera.position.x,
      camera.position.y,
      camera.position.z,
    ]);
    setCameraRotation([
      camera.rotation.x,
      camera.rotation.y,
      camera.rotation.z,
    ]);
  }

  return (
    <>
      <Canvas style={{ width: "100vw", height: "100vh" }}>
        <color attach="background" args={["#454552"]} />
        {import.meta.env.DEV && <OrbitControls />}
        <PerspectiveCamera makeDefault position={cameraPosition} />
        <CameraController
          onCameraChange={onCameraChange}
          interruptAnimation={interruptAnimation}
        />
        <Suspense fallback={null}>
          <Nwero />
        </Suspense>
      </Canvas>

      {import.meta.env.DEV && (
        <>
          <button
            className="debug-button primary-button"
            onClick={() => setInterruptAnimation(!interruptAnimation)}
          >
            {interruptAnimation ? "Unpause" : "Pause"}
          </button>
          <span className="debug-text">
            Camera position:{" "}
            {
              // Format to 3 decimal places
              cameraPosition.map((pos) => pos.toPrecision(3)).join(", ")
            }
            <br />
            Camera rotation:{" "}
            {cameraRotation.map((pos) => pos.toPrecision(3)).join(", ")}
          </span>
        </>
      )}
    </>
  );
}

function Navbar() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function onCreditsClicked() {
    dialogRef.current?.showModal();
  }

  return (
    <nav>
      {/* @ts-ignore */}
      <marquee>
        Sometimes indecisiveness springs from self-doubt, and other times it's
        just because you're trapped in the Harrison Temple
      {/* @ts-ignore */}
      </marquee>
      <AudioManager />

      <img src="/GIGANEURO.png" alt="GIGANEURO" />
      <div className="nav-middle">
        <div className="nav-mid">
          <span>THE HARRISON TEMPLE</span>
        </div>
      </div>
      <img className="neuro-look-left" src="/GIGANEURO.png" alt="GIGANEURO" />

      {/* Credits section */}
      <button
        className="credits-button navbar-button"
        onClick={onCreditsClicked}
      >
        Credits
      </button>
      <dialog ref={dialogRef} className="credit">
        <ul>
          <li>
            Created by{" "}
            <a
              href="https://ethan-hanlon.xyz"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ethan Hanlon
            </a>
            .
          </li>
          <li>
            Model credit{" "}
            <a
              href="https://skfb.ly/oJKs8"
              target="_blank"
              rel="noopener noreferrer"
            >
              Taprieiko
            </a>{" "}
            under{" "}
            <a
              href="http://creativecommons.org/licenses/by-nc/4.0/"
              target="_blank"
              rel="noopener noreferrer"
            >
              CC BY-NC
            </a>
            .
          </li>
          <li>
            Song:{" "}
            <a
              href="https://www.youtube.com/watch?v=QJJYpsA5tv8"
              target="_blank"
              rel="noopener noreferrer"
            >
              Can You Feel My Heart
            </a>{" "}
            by Bring Me The Horizon.
          </li>
        </ul>

        <form method="dialog">
          <button>Close</button>
        </form>
      </dialog>
    </nav>
  );
}

function App() {
  const [loaded, setLoaded] = useState(false);
  const [started, setStarted] = useState(false);

  return (
    <SceneContext.Provider value={{ loaded, started, setLoaded, setStarted }}>
      <Navbar />
      <div className="grayscale">
        <Starter>
          <SceneCanvas />
        </Starter>
      </div>
    </SceneContext.Provider>
  );
}

export default App;
