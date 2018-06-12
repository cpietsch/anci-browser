const tf = require('@tensorflow/tfjs')

const {Image} = require('./image.js');
const {ControllerDataset} = require('./controller_dataset.js');

const NUM_CLASSES = 2
const NUM_UNITS = 100
const LEARNING_RATE = 0.0001
const BATCH_SIZE = 0.4
const NUM_EPOCHS = 20

const image = new Image()
// document.getElementById('webcam')

const controllerDataset = new ControllerDataset(NUM_CLASSES)

let mobilenet
let model

// Loads mobilenet and returns a model that returns the internal activation
// we'll use as input to our classifier model.
async function loadMobilenet () {
  const mobilenet = await tf.loadModel('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json')

  // Return a model that outputs an internal activation.
  const layer = mobilenet.getLayer('conv_pw_13_relu')
  return tf.model({inputs: mobilenet.inputs, outputs: layer.output})
}

function learnImage (elem, label) {
  const img = image.capture(elem)
  tf.tidy(() => {
    controllerDataset.addExample(mobilenet.predict(img), label)

    // Draw the preview thumbnail.
    // ui.drawThumb(img, label)
  })
}

/**
 * Sets up and trains the classifier.
 */
async function train () {
  if (controllerDataset.xs == null) {
    throw new Error('Add some examples before training!')
  }

  // Creates a 2-layer fully connected model. By creating a separate model,
  // rather than adding layers to the mobilenet model, we "freeze" the weights
  // of the mobilenet model, and only train weights from the new model.
  model = tf.sequential({
    layers: [
      // Flattens the input to a vector so we can use it in a dense layer. While
      // technically a layer, this only performs a reshape (and has no training
      // parameters).
      tf.layers.flatten({inputShape: [7, 7, 256]}),
      // Layer 1
      tf.layers.dense({
        units: NUM_UNITS,
        activation: 'relu',
        kernelInitializer: 'varianceScaling',
        useBias: true
      }),
      // Layer 2. The number of units of the last layer should correspond
      // to the number of classes we want to predict.
      tf.layers.dense({
        units: NUM_CLASSES,
        kernelInitializer: 'varianceScaling',
        useBias: false,
        activation: 'softmax'
      })
    ]
  })

  // Creates the optimizers which drives training of the model.
  const optimizer = tf.train.adam(LEARNING_RATE)
  // We use categoricalCrossentropy which is the loss function we use for
  // categorical classification which measures the error between our predicted
  // probability distribution over classes (probability that an input is of each
  // class), versus the label (100% probability in the true class)>
  model.compile({optimizer: optimizer, loss: 'categoricalCrossentropy'})

  // We parameterize batch size as a fraction of the entire dataset because the
  // number of examples that are collected depends on how many examples the user
  // collects. This allows us to have a flexible batch size.
  const batchSize =
      Math.floor(controllerDataset.xs.shape[0] * BATCH_SIZE)
  if (!(batchSize > 0)) {
    throw new Error(
        `Batch size is 0 or NaN. Please choose a non-zero fraction.`)
  }

  // Train the model! Model.fit() will shuffle xs & ys so we don't have to.
  model.fit(controllerDataset.xs, controllerDataset.ys, {
    batchSize,
    epochs: NUM_EPOCHS,
    callbacks: {
      onBatchEnd: async (batch, logs) => {
        console.log('Loss: ' + logs.loss.toFixed(5))
        await tf.nextFrame()
      }
    }
  })
}

let isPredicting = false

async function predict (elem) {
  const img = image.capture(elem)
  const predictedClass = tf.tidy(() => {
    // Capture the frame from the webcam.

    // Make a prediction through mobilenet, getting the internal activation of
    // the mobilenet model.
    const activation = mobilenet.predict(img)

    // Make a prediction through our newly-trained model using the activation
    // from mobilenet as input.
    const predictions = model.predict(activation)

    // Returns the index with the maximum probability. This number corresponds
    // to the class the model thinks is the most probable given the input.
    return predictions.as1D().argMax()
  })

  const classId = (await predictedClass.data())[0]
  predictedClass.dispose()

  // ui.predictClass(classId)
  // await tf.nextFrame()
  // ui.donePredicting()
  return classId
}

async function init () {
  // await webcam.setup()
  console.log('init')
  mobilenet = await loadMobilenet()
  console.log('init done')
  // Warm up the model. This uploads weights to the GPU and compiles the WebGL
  // programs so the first time we collect data from the webcam it will be
  // quick.
  let imageData = new ImageData(224, 224)
  tf.tidy(() => mobilenet.predict(image.capture(imageData)))

  model = await tf.loadModel('https://chrispie.com/anci/anci-1.json')

  // ui.init()
}

async function save () {
  const saveResult = await model.save('indexeddb://anci-1')
  return saveResult
}

async function download () {
  const saveResult = await model.save('downloads://anci-1')
  return saveResult
}

async function load () {
  model = await tf.loadModel('indexeddb://anci-1')
  return model
}

init()

exports.learnImage = learnImage
exports.train = train
exports.predict = predict
exports.load = load
exports.save = save


// Initialize the application.
// init()
