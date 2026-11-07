import './style.css'
import { N, Viewable } from '@/util/ui'

export class Contour extends Viewable {
  constructor() {
    super()
    this.view = N('canvas', null, {
      class: 'contour',
    }) as HTMLCanvasElement
  }
}
