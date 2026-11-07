import './style.css'
import { N, Viewable } from '@/util/ui'
import { docscan } from 'docscan'
import { dropIn, dropOut, fromElement, toImage, valid, type DropInOptions } from 'drop.that'
import jsPDF from 'jspdf'
//import { createWorker } from 'tesseract.js'

const inOptions: Partial<DropInOptions> = {
  valid: valid.isImage,
  url: 'doc-050-in.jpg',
  startButtonText: 'detect',
  allowClose: false,
}

const toPDF = async (image: HTMLImageElement): Promise<HTMLIFrameElement> => {
  var doc = new jsPDF()
  doc.addImage(image, 'PNG', 0, 0, 210, 297, undefined, 'FAST')
  return N('iframe', undefined, { src: doc.output('datauristring') }) as HTMLIFrameElement
}

//const recognizeText = async (image: HTMLImageElement): Promise<string> => {
//  const worker = await createWorker('deu')
//  const ret = await worker.recognize(image.src)
//  await worker.terminate()
//  return ret.data.text
//}

export class App extends Viewable {
  constructor() {
    super()
    this.view = N('div')
    void this.run()
  }

  async run() {
    void dropIn(inOptions).then(toImage).then(docscan).then(toPDF).then(fromElement).then(dropOut)
  }
}
