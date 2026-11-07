import { loadOpenCV, type OpenCV } from '@opencvjs/web'
import { operation, type ImgOp } from './imageOperation.ts'

type Point = OpenCV.Point
type Mat = OpenCV.Mat

export class Docscan {
  cv: typeof OpenCV
  ops: Record<string, Mat> = {}
  seq: Mat[] = []
  dim: Point = { x: 0, y: 0 }
  corners: Point[] = []
  img: HTMLImageElement = document.createElement('img')

  static async init(): Promise<Docscan> {
    return new Docscan(await loadOpenCV())
  }

  static async detect(image: HTMLImageElement): Promise<HTMLImageElement> {
    return (
      (await this.init())
        .read(image)
        .gray()
        .contrast()
        //.normalize()
        .blur()
        //.histogram()
        .threshold()
        .contour()
        .perspective()
        .image()
        .cleanup()
        .getImage()
    )
  }

  constructor(cv: typeof OpenCV) {
    this.cv = cv
  }

  step(label: string, input: Mat, doop?: ImgOp) {
    const cv = this.cv!
    const mat = doop ? doop(cv, input, new cv.Mat()) : input
    this.seq.push(mat)
    this.ops[label] = mat
    return this
  }

  read(image: HTMLImageElement) {
    this.dim.x = image.width
    this.dim.y = image.height
    return this.step('orig', this.cv!.imread(image))
  }

  prev() {
    return this.seq.at(-1) ?? new this.cv.Mat()
  }

  gray() {
    return this.step('gray', this.prev(), operation.gray)
  }

  contrast() {
    return this.step('contrast', this.prev(), operation.contrast)
  }

  equalize() {
    return this.step('equalize', this.prev(), operation.equalize)
  }

  clahe() {
    return this.step('clahe', this.prev(), operation.clahe)
  }

  histogram() {
    return this.step('histogram', this.prev(), operation.histogram)
  }

  normalize() {
    return this.step('normalize', this.prev(), operation.normalize)
  }

  blur() {
    return this.step('blur', this.prev(), operation.blur)
  }

  edge() {
    return this.step('edge', this.prev(), operation.edge)
  }

  threshold() {
    return this.step('threshold', this.prev(), operation.threshold)
  }

  contour() {
    return this.step('contour', this.prev(), operation.contour)
  }

  perspective() {
    return this.step('perspective', this.ops['contrast'], operation.perspective)
  }

  cleanup() {
    this.seq.forEach((m) => m.delete())
    return this
  }

  image() {
    const canvas = document.createElement('canvas')
    canvas.width = this.dim.x
    canvas.height = this.dim.y
    this.cv.imshow(canvas, this.prev())
    this.img.src = canvas.toDataURL('image/png')
    return this
  }

  getImage() {
    return this.img
  }
}

export const docscan = async (image: HTMLImageElement): Promise<HTMLImageElement> =>
  await Docscan.detect(image)
