import type { OpenCV } from '@opencvjs/web'

type Mat = OpenCV.Mat
type Point = OpenCV.Point

export type ImgOp = (cv: typeof OpenCV, input: Mat, output: Mat) => Mat

export let contourPoints: Point[] = Array.from({ length: 4 }).map(() => ({ x: 0, y: 0 }))

const distance = (p1: Point, p2: Point): number => Math.hypot(p1.x - p2.x, p1.y - p2.y)

const getCornerPoints = (cv: typeof OpenCV, contour: Mat): Point[] => {
  const points: Point[] = []
  const rect = cv.minAreaRect(contour)
  const center = rect.center

  let tlp
  let tld = 0
  let trp
  let trd = 0
  let blp
  let bld = 0
  let brp
  let brd = 0

  for (let i = 0; i < contour.data32S.length; i += 2) {
    const point = { x: contour.data32S[i], y: contour.data32S[i + 1] }
    const d = distance(point, center)
    if (point.x < center.x && point.y < center.y) {
      if (d > tld) {
        tlp = point
        tld = d
      }
    } else if (point.x > center.x && point.y < center.y) {
      if (d > trd) {
        trp = point
        trd = d
      }
    } else if (point.x < center.x && point.y > center.y) {
      if (d > bld) {
        blp = point
        bld = d
      }
    } else if (point.x > center.x && point.y > center.y) {
      if (d > brd) {
        brp = point
        brd = d
      }
    }
  }
  points.push(tlp as Point)
  points.push(trp as Point)
  points.push(brp as Point)
  points.push(blp as Point)
  return points
}

export const operation: Record<string, ImgOp> = {
  gray: (cv: typeof OpenCV, input: Mat, output: Mat) => (
    cv.cvtColor(input, output, cv.COLOR_RGBA2GRAY),
    output
  ),
  blur: (cv: typeof OpenCV, input: Mat, output: Mat) => (
    cv.GaussianBlur(input, output, new cv.Size(5, 5), 0),
    output
  ),
  edge: (cv: typeof OpenCV, input: Mat, output: Mat) => (cv.Canny(input, output, 75, 200), output),
  threshold: (cv: typeof OpenCV, input: Mat, output: Mat) => (
    cv.threshold(input, output, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU),
    output
  ),
  contrast: (cv: typeof OpenCV, input: Mat, output: Mat) => {
    //cv.convertScaleAbs(input, output, 2, 1)
    const brightness = 16
    const contrast = 64
    let shadow = 0
    let highlight = 0
    let alpha_b
    let gamma_b
    //if (brightness !== 0)
    {
      if (brightness > 0) {
        shadow = brightness
        highlight = 255
      } else {
        shadow = 0
        highlight = 255 + brightness
      }
      alpha_b = (highlight - shadow) / 255
      gamma_b = shadow
      cv.addWeighted(input, alpha_b, input, 0, gamma_b, output)
    }
    //if (contrast !== 0)
    {
      const f = (131 * (contrast + 127)) / (127 * (131 - contrast))
      const alpha_c = f
      const gamma_c = 127 * (1 - f)

      cv.addWeighted(output, alpha_c, output, 0, gamma_c, output)
    }

    return output
  },
  equalize: (cv: typeof OpenCV, input: Mat, output: Mat) => (
    cv.equalizeHist(input, output),
    output
  ),
  clahe: (cv: typeof OpenCV, input: Mat, output: Mat) => (
    new cv.CLAHE(40, new cv.Size(8, 8)).apply(input, output),
    output
  ),
  histogram: (cv: typeof OpenCV, input: Mat, output: Mat) => {
    const histSize = 256
    const srcVec = new cv.MatVector()
    srcVec.push_back(input)
    const hist = new cv.Mat()
    const mask = new cv.Mat()
    const color = new cv.Scalar(255, 255, 255)
    const scale = 2
    cv.calcHist(srcVec, [0], mask, hist, [histSize], [0, 255], false)
    const result = cv.minMaxLoc(hist, mask)
    const max = result.maxVal
    const dst = cv.Mat.zeros(input.rows, histSize * scale, cv.CV_8UC3)
    for (let i = 0; i < histSize; i++) {
      const binVal = (hist.data32F[i] * input.rows) / max
      const point1 = new cv.Point(i * scale, 0)
      const point2 = new cv.Point((i + 1) * scale - 1, input.rows - binVal)
      cv.line(dst, point1, point2, color)
    }
    output.delete()
    srcVec.delete()
    mask.delete()
    hist.delete()
    return dst
  },
  normalize: (cv: typeof OpenCV, input: Mat, output: Mat) => {
    const histSize = 256
    const srcVec = new cv.MatVector()
    srcVec.push_back(input)
    const hist = new cv.Mat()
    const mask = new cv.Mat()
    cv.calcHist(srcVec, [0], mask, hist, [histSize], [0, 255], false)
    output.delete()
    srcVec.delete()
    mask.delete()
    hist.delete()
    return hist
    /*
    const accumulator = []
    accumulator.push(hist[0])
    for index in range(1, hist_size):
        accumulator.append(accumulator[index -1] + float(hist[index]))
    
    # Locate points to clip
    maximum = accumulator[-1]
    clip_hist_percent *= (maximum/100.0)
    clip_hist_percent /= 2.0
    
    # Locate left cut
    minimum_gray = 0
    while accumulator[minimum_gray] < clip_hist_percent:
        minimum_gray += 1
    
    # Locate right cut
    maximum_gray = hist_size -1
    while accumulator[maximum_gray] >= (maximum - clip_hist_percent):
        maximum_gray -= 1
    
    # Calculate alpha and beta values
    alpha = 255 / (maximum_gray - minimum_gray)
    beta = -minimum_gray * alpha
    
    '''
    # Calculate new histogram with desired range and show histogram 
    new_hist = cv2.calcHist([gray],[0],None,[256],[minimum_gray,maximum_gray])
    plt.plot(hist)
    plt.plot(new_hist)
    plt.xlim([0,256])
    plt.show()
    '''

    auto_result = cv2.convertScaleAbs(image, alpha=alpha, beta=beta)
    return (auto_result, alpha, beta)
    */
  },
  contour: (cv: typeof OpenCV, input: Mat, output: Mat) => {
    const contours = new cv.MatVector()
    const hierarchy = new cv.Mat()
    cv.findContours(input, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE)
    let maxArea = 0
    let maxContourIndex = -1
    for (let i = 0; i < contours.size(); ++i) {
      let contourArea = cv.contourArea(contours.get(i))
      if (contourArea > maxArea) {
        maxArea = contourArea
        maxContourIndex = i
      }
    }
    const maxContour = contours.get(maxContourIndex)
    const points = (contourPoints = getCornerPoints(cv, maxContour))
    hierarchy.delete()
    contours.delete()
    output.delete()
    output = cv.Mat.zeros(input.rows, input.cols, cv.CV_8UC3)
    const color = new cv.Scalar(64, 255, 64, 255)
    cv.line(output, points[0], points[1], color, 1)
    cv.line(output, points[1], points[2], color, 1)
    cv.line(output, points[2], points[3], color, 1)
    cv.line(output, points[3], points[0], color, 1)
    return output
  },
  perspective: (cv: typeof OpenCV, input: Mat, output: Mat) => {
    const points = contourPoints
    const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
      points[0].x,
      points[0].y,
      points[1].x,
      points[1].y,
      points[3].x,
      points[3].y,
      points[2].x,
      points[2].y,
    ])

    const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0,
      0,
      input.cols,
      0,
      0,
      input.rows,
      input.cols,
      input.rows,
    ])

    const M = cv.getPerspectiveTransform(srcTri, dstTri)
    const dsize = new cv.Size(input.cols, input.rows)
    cv.warpPerspective(
      input,
      output,
      M,
      dsize,
      cv.INTER_LINEAR,
      cv.BORDER_CONSTANT,
      new cv.Scalar(),
    )
    return output
  },
}
