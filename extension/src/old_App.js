import { useRef, useState,useEffect } from 'react'

import logo from './logo.svg';
import './App.css';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-webgpu';

import * as faceDetection from '@tensorflow-models/face-detection';
import * as mpFaceDetection from '@mediapipe/face_detection';

import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';

import * as tf from '@tensorflow/tfjs-core';
import * as tfjs from '@tensorflow/tfjs'

import * as bodyPix from '@tensorflow-models/body-pix';
import * as blazeface from '@tensorflow-models/blazeface';

import * as faceapi from 'face-api.js';

import * as cocoSsd from '@tensorflow-models/coco-ssd';

import img1 from './Images/man2.jpg'


// import img1 from './Images/akra-man-woman.jpg'

// import vidSrc from "./why do RICH people keep pretending they’re POOR.mp4"

// import mdPath from '/weights'

tfjsWasm.setWasmPaths(
  `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${
      tfjsWasm.version_wasm}/dist/`);

    
      
  
async function createDetector(params) {
  console.log(faceDetection);
  await tf.ready()
  // await tf.setBackend()
  const detector=await faceDetection.createDetector(faceDetection.SupportedModels.MediaPipeFaceDetector, {
    runtime:'tfjs',
    modelType: 'short',
    maxFaces: 1,
  });

  console.log(detector);
  
  
}



function App() {
  // createDetector()
  const [model, setModel] = useState(null);
  const [genderModel, setGenderModel] = useState(null);
  const [faceModel, setFaceModel] = useState(null);
  const [cocoModel,setCocoModel] = useState(null);
  const [segmentationImage, setSegmentationImage] = useState(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const [segments, setSegments] = useState([]);
  const [keypoints, setKeypoints] = useState([]);

  const [predictions, setPredictions] = useState([]);

  const modelPath = "/weights/age_gender_model-weights_manifest.json"
  // console.log(modelPath);
  
    // console.log(mdPath);

    // const processSegmentation = (segmentation) => {
    //   const { data, width, height } = segmentation;
  
    //   // Generate clip-paths from segmentation data
    //   // For simplicity, here we create a basic clip-path
    //   // You would need to convert segmentation data to actual polygon points
    //   return [
    //     {
    //       clipPath: 'polygon(10% 10%, 60% 10%, 60% 60%, 10% 60%)', // Example polygon
    //       backgroundColor: 'rgba(0, 255, 0, 0.5)', // semi-transparent green
    //     },
    //     // Add more segments as necessary
    //   ];
    // };

    const extractContours = (binaryMask) => {
      // For demo, just create a simple rectangle
      // Replace with actual contour extraction
      return [
        '10% 10%',
        '60% 10%',
        '60% 60%',
        '10% 60%'
      ];
    };

    const processSegmentation = (segmentation) => {
      const { data, width, height } = segmentation;
      const polygons = [];
  
      // Convert the segmentation mask to polygons
      const binaryMask = new Array(height).fill(null).map(() => new Array(width).fill(0));
  
      // Populate binaryMask from data
      for (let i = 0; i < data.length; i++) {
        const row = Math.floor(i / width);
        const col = i % width;
        binaryMask[row][col] = data[i] === 1 ? 1 : 0; // Assuming 1 is the segment
      }
  
      // Extract contours (simplified for demo purposes)
      // In a real implementation, use a library to detect contours and create polygons
      const contour = extractContours(binaryMask);
  
      // Create clip-path polygon string
      const clipPath = `polygon(${contour.join(', ')})`;
  
      // Create polygon data
      polygons.push({
        clipPath,
        backgroundColor: 'rgba(0, 255, 0, 0.5)', // semi-transparent green
      });
  
      console.log(polygons);
      
      return polygons;
    };

    const drawKeypoints = (keypoints,img) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
  
      // Clear previous drawings
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      // Set canvas size to match the image
      canvas.width = img.current.width;
      canvas.height = img.current.height;
  
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
  
      // Draw lines connecting keypoints (e.g., skeleton)
      const adjacentKeyPoints = [
        ['nose', 'leftEye'],
        ['nose', 'rightEye'],
        ['leftEye', 'leftEar'],
        ['rightEye', 'rightEar'],
        ['leftShoulder', 'rightShoulder'],
        ['leftShoulder', 'leftElbow'],
        ['leftElbow', 'leftWrist'],
        ['rightShoulder', 'rightElbow'],
        ['rightElbow', 'rightWrist'],
        ['leftShoulder', 'leftHip'],
        ['rightShoulder', 'rightHip'],
        ['leftHip', 'rightHip'],
        ['leftHip', 'leftKnee'],
        ['leftKnee', 'leftAnkle'],
        ['rightHip', 'rightKnee'],
        ['rightKnee', 'rightAnkle'],
      ];
  
      adjacentKeyPoints.forEach((pair) => {
        const keypointA = keypoints.find((kp) => kp.part === pair[0]);
        const keypointB = keypoints.find((kp) => kp.part === pair[1]);
  
        if (keypointA && keypointB) {
          ctx.beginPath();
          ctx.moveTo(keypointA.position.x, keypointA.position.y);
          ctx.lineTo(keypointB.position.x, keypointB.position.y);
          ctx.stroke();
        }
      });
    };
  
  const performSegmentation = async () => {
   
    
    const img=document.querySelector('img')

    const canvas=document.querySelector('canvas')
    

    canvas.width=img.width
    canvas.height=img.height
    
    
  
    const segmentation = await model.segmentPerson(img);

    console.log(segmentation);

    // const newSegments = processSegmentation(segmentation);
    // setSegments(newSegments);

    const pose = segmentation.allPoses[0]; // Assuming one person is detected
    // setKeypoints(pose.keypoints);
    // drawKeypoints(pose.keypoints);
    

    // const faces=await genderModel.estimateFaces(img)
    // console.log(faces);
    


    // return

    const ctx = canvas.getContext('2d');


    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  

//     const offscreenCanvas = document.createElement('canvas');
// const offscreenCtx = offscreenCanvas.getContext('2d');
// offscreenCanvas.width = canvas.width;
// offscreenCanvas.height = canvas.height;

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    // ctx.filter = 'blur(10px)';

    for (let y = 0; y < segmentation.height; y++) {
      for (let x = 0; x < segmentation.width; x++) {
          const n = y * segmentation.width + x;
          if (segmentation.data[n] === 1) {
              // Draw a small rectangle or point for the outline
              ctx.strokeRect(x, y, 1, 1);
          }
      }
    }
    // console.log('Here 1');
    // offscreenCtx.filter = 'blur(10px)';
    // offscreenCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
    // console.log(offscreenCanvas);
    
    


console.log('Here 4');
    
   
  }

  const loadAllModels = async () => {
    // console.log(tf);
    
      await tf.ready()
      const faceNet = await blazeface.load();
      console.log(faceNet);
      setFaceModel(faceNet)

      const cocoNet = await cocoSsd.load();
      console.log(cocoNet);
      
      setCocoModel(cocoNet);
      
      
      const net = await bodyPix.load();
      console.log(net);
      setModel(net);

      

     let genderNet=await  tfjs.loadLayersModel('gender/model.json');
    // let genderNet=await  tfjs.loadLayersModel('age_gender_model');
     setGenderModel(genderNet);
      console.log(genderNet);

      await faceapi.nets.ssdMobilenetv1.loadFromUri('/ssd_mobilenetv1');
      await faceapi.nets.ageGenderNet.loadFromUri('/age_gender_model');
      console.log(faceapi);
      
      
     
      
  };

  useEffect(() => {
    

    loadAllModels();
}, []);

const predictTensorGender=async(tns)=>{
  // let prediction=genderModel.predict(tns)
  // console.log(prediction);

  const predictions = await genderModel.predict(tns).data();
  console.log(predictions);
  predictions.forEach(item=>{
    const gender = item > 0.5 ? 'Male' : 'Female';
    console.log(gender);
  })
  
  
  

  
}
const genderProcess=(canv)=>{
  let tensor = tfjs.browser.fromPixels(canv)
  .resizeNearestNeighbor([96, 96]) // Adjust size based on model input
        .toFloat()
        .expandDims();
  // tensor = tf.cast(tensor, 'float32');
  // tensor = tensor.div(255.0);
  // tensor = tensor.expandDims(0);

  predictTensorGender(tensor)
  
}
const predictGenderOnPositions=async(media,faces)=>{
  const ctx = media.getContext('2d');
  const genders=[]
  for (const face of faces) {
    const {x, y, width, height} = face
    const faceImage = ctx.getImageData(x, y, width, height);
    // console.log(faceImage);
    
    const faceTensor = tf.browser.fromPixels(faceImage)
          .resizeNearestNeighbor([96, 96]) // Resize to model input size
          .toFloat()
          .div(tf.scalar(255)) // Normalize pixel values to [0, 1]
          .expandDims();

          const prediction = await genderModel.predict(faceTensor).data();

          console.log(prediction);
          
          const gender = prediction[0] > 0.5 ? 'Female' : 'Male';

          genders.push(gender)
  }

  console.log(genders);
  
}
const getFacePositions=async(media)=>{
  const facesPoses = await faceModel.estimateFaces(media, false);
 
  console.log(facesPoses);
  
  let faces=[]
  if(facesPoses[0]){
    facesPoses.forEach(obj=>{
      const {topLeft,bottomRight}=obj

      let [x,y]=topLeft
      let [x2,y2]=bottomRight

      const height=y2-y
      const width=x2-x

      faces.push({x,y,height,width})
    })

    predictGenderOnPositions(media,faces)
  }

  
  
  // if (facesPoses.length > 0) {
  //   // Convert face bounding boxes to [x, y, width, height]
  //   const faceBoxes = facesPoses.forEach(face => {
  //     const [x, y, width, height] = face.topLeft.concat(face.bottomRight);

  //     face.push({x,y,width:width - x,height:height - y})
  //     // return [x, y, width - x, height - y];
  //   });
  //   console.log(facesPoses);
  //   console.log(faces);
    
    
    // await predictGenders(faceBoxes);
  // }
  
}

const drawSegmentation = (segmentation,vid) => {
  const canvas = document.querySelector('canvas')
  const ctx = canvas.getContext('2d');

  const gendCanvas=document.createElement('canvas')
  const gCtx = gendCanvas.getContext('2d');

  // Set canvas size to match the video
  canvas.width = vid.videoWidth;
  canvas.height = vid.videoHeight;

 
  

  const { data: segmentationData, width, height } = segmentation;

  gendCanvas.width = width;
  gendCanvas.height = height;

  gCtx.drawImage(vid, 0, 0, width, height);

  // genderProcess(gendCanvas)
  getFacePositions(gendCanvas)
  return

  ctx.clearRect(0, 0, width, height); // Clear previous frame

  ctx.fillStyle = 'rgba(192, 192, 192, 0.5)'

  // Draw segmentation data onto the canvas
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;

      if (segmentationData[index] === 1) { // Only draw the person
        ctx.strokeRect(x, y, 1, 1);
      }
    }
  }

  console.log(canvas);
  // ctx.clearRect(0, 0, width, height);
  
};
const filterByGender = async (predictions,canvas) => {
  const filtered = [];

  // console.log(predictions);
  
  for (const prediction of predictions) {
    if (prediction.class === 'person') {
      // console.log(prediction);
      
      const [x, y, width, height] = prediction.bbox;
      const faceCanvas = document.createElement('canvas');
      faceCanvas.width = width;
      faceCanvas.height = height;
      const ctx = faceCanvas.getContext('2d');

      ctx.drawImage(
        canvas,
        x, y, width, height,  // Source rectangle
        0, 0, width, height   // Destination rectangle
      );

      let div=document.createElement('div')
      div.appendChild(faceCanvas)
      const faceImage = ctx.getImageData(x, y, width, height);

      // const detection = await faceapi.detectSingleFace(faceCanvas).withAgeAndGender();
      // console.log(detection);
      
    // console.log(faceImage);
    
      const faceTensor = tf.browser.fromPixels(faceImage)
          .resizeNearestNeighbor([96, 96]) // Resize to model input size
          .toFloat()
          .div(tf.scalar(255)) // Normalize pixel values to [0, 1]
          .expandDims();

          const prediction2 = await genderModel.predict(faceTensor).data();

          // console.log(prediction);
          
          const gender = prediction2[0] > 0.5 ? 'Female' : 'Male';
          // console.log(div);
          console.log(gender);
          
          
      // document.body.appendChild(div)
      // const detection = await faceapi.detectSingleFace(faceCanvas).withGender();

      // if (detection && detection.gender === 'female') {
      //   filtered.push(prediction);
      // }
    }
  }

  return filtered;
};
const drawBoundingBoxes = (predictions,media) => {
  const width=media.width || media.videoWidth
  const height=media.height || media.videoHeight
  console.log(width,height);
  
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);

  predictions.forEach((prediction) => {
    if (prediction.class === 'person') {
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        prediction.bbox[0],
        prediction.bbox[1],
        prediction.bbox[2],
        prediction.bbox[3]
      );
      // ctx.font = '18px Arial';
      // ctx.fillStyle = 'red';
      // ctx.fillText(
      //   prediction.class,
      //   prediction.bbox[0],
      //   prediction.bbox[1] > 10 ? prediction.bbox[1] - 5 : 10
      // );
    }
  });
};
const getPersons=(vid)=>{
  return new Promise(async(resolve, reject) => {
    const div=document.createElement('div')
    const canvas=document.createElement('canvas')
    const width=vid.width || vid.videoWidth
    const height=vid.height || vid.videoHeight
    canvas.width=width
    canvas.height=height
    const ctx = canvas.getContext('2d');
    ctx.drawImage(
      vid,
      0, 0, width, height   // Destination rectangle
    );

    const predictions = await cocoModel.detect(vid);
    console.log(predictions);
    // drawBoundingBoxes(predictions,vid)
    // div.appendChild(canvas)
    // document.body.appendChild(div)
    filterByGender(predictions,canvas)
    setPredictions(predictions);
    resolve(predictions)
    
  })
}
const segmentFrame = async () => {
  const vid=document.querySelector('video')
  // console.log(vid,!vid.paused);
  
  if (vid && !vid.paused) {

    let pp=await getPersons(vid)
    
    // const segmentation = await model.segmentPerson(vid);

    // drawSegmentation(segmentation,vid);

    requestAnimationFrame(segmentFrame);
  }
};

const handlePlay=()=>{
  segmentFrame();
}
const handlePause=()=>{
  cancelAnimationFrame(segmentFrame);
}


  return (
    <div className="App">
      <h1>Body Segmentation with TensorFlow.js</h1>

      <div className='vidParent' style={{position: 'relative'}}>
        <video  controls style={{position: 'absolute',top:"0px",left:"0px"}}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handlePause}>

        <source type="video/mp4" src="/Videos/why do RICH people keep pretending they’re POOR.mp4"/>

        </video>

        {predictions.map((prediction, index) => (
        prediction.class === 'person' && (
          <span
            key={index}
            style={{
              position: 'absolute',
              left: `${prediction.bbox[0]}px`,
              top: `${prediction.bbox[1]}px`,
              width: `${prediction.bbox[2]}px`,
              height: `${prediction.bbox[3]}px`,
              border: '2px solid red',
              color: 'red',
              fontWeight: 'bold',
              pointerEvents: 'none',
              fontSize: '18px',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {prediction.class}
          </span>
        )
      ))}

        {/* <div style={{position: 'absolute',top:"0px",left:"0px",pointerEvents:"none"}}>
            <canvas 
            />
        </div> */}
      </div>

        

        {/* <div style={{marginTop:"600px"}}>
          <button onClick={performSegmentation}>Segment Image</button>
        </div>

        <div style={{position: 'relative',height:"600px",width:"600px",backgroundColor:"blue"}}>
          
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        />
        </div> */}

      
    </div>
  );
}

export default old_App;
