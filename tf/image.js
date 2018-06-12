// import * as tf from '@tensorflow/tfjs'
const tf = require('@tensorflow/tfjs')

class Image {

  capture (elem) {
    return tf.tidy(() => {
      const webcamImage = tf.fromPixels(elem)

      // Crop the image so we're using the center square of the rectangular
      // webcam.
      // const croppedImage = this.cropImage(webcamImage)
      const croppedImage = tf.image.resizeBilinear(webcamImage, [224, 224])
      // Expand the outer most dimension so we have a batch size of 1.
      const batchedImage = croppedImage.expandDims(0)

      // Normalize the image between -1 and 1. The image comes in between 0-255,
      // so we divide by 127 and subtract 1.
      return batchedImage.toFloat().div(tf.scalar(127)).sub(tf.scalar(1))
    })
  }

  /**
   * Crops an image tensor so we get a square image with no white space.
   * @param {Tensor4D} img An input image Tensor to crop.
   */
  cropImage (img) {
    const size = Math.min(img.shape[0], img.shape[1])
    console.log(size)
    const centerHeight = img.shape[0] / 2
    const beginHeight = centerHeight - (size / 2)
    const centerWidth = img.shape[1] / 2
    const beginWidth = centerWidth - (size / 2)
    return img.slice([beginHeight, beginWidth, 0], [size, size, 3])
  }

}

exports.Image = Image