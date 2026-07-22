import Feature from 'ol/Feature.js'
import CircleGeometry from 'ol/geom/Circle.js'
import Point from 'ol/geom/Point.js'
import Polygon from 'ol/geom/Polygon.js'
import { fromLonLat } from 'ol/proj.js'
import CircleStyle from 'ol/style/Circle.js'
import Fill from 'ol/style/Fill.js'
import Stroke from 'ol/style/Stroke.js'
import Style from 'ol/style/Style.js'
import type { StyleFunction } from 'ol/style/Style.js'
import type { CurrentLocation } from '../features/route/routeTypes'

export type CurrentLocationFeatureKind = 'accuracy' | 'heading-cone' | 'heading-triangle' | 'marker'

const accuracyStyle = new Style({
  fill: new Fill({ color: 'rgb(45 125 246 / 5%)' }),
  stroke: new Stroke({ color: 'rgb(45 125 246 / 18%)', width: 1 }),
  zIndex: 0,
})

const headingConeStyle = new Style({
  fill: new Fill({ color: 'rgb(52 138 255 / 26%)' }),
  stroke: new Stroke({ color: 'rgb(52 138 255 / 10%)', width: 1 }),
  zIndex: 1,
})

const markerStyle = new Style({
  image: new CircleStyle({
    radius: 9,
    fill: new Fill({ color: '#2583f7' }),
    stroke: new Stroke({ color: '#ffffff', width: 3.5 }),
  }),
  zIndex: 3,
})

const headingTriangleStyle = new Style({
  fill: new Fill({ color: '#1676e8' }),
  stroke: new Stroke({ color: '#ffffff', width: 1.5 }),
  zIndex: 2,
})

export const currentLocationStyle: StyleFunction = (feature) => {
  const kind = feature.get('kind') as CurrentLocationFeatureKind
  if (kind === 'accuracy') return accuracyStyle
  if (kind === 'heading-cone') return feature.get('headingVisible') ? headingConeStyle : undefined
  if (kind === 'heading-triangle') {
    const heading = feature.get('headingDegrees') as number | null
    return heading == null ? undefined : headingTriangleStyle
  }
  return markerStyle
}

/** Creates the four features owned by the current-location layer. */
export function createCurrentLocationFeatures(location: CurrentLocation) {
  const center = fromLonLat(location.coordinate)
  const projectionScale = 1 / Math.cos(location.coordinate[1] * Math.PI / 180)
  const accuracyFeature = new Feature({
    geometry: new CircleGeometry(center, location.accuracyMeters * projectionScale),
    kind: 'accuracy' satisfies CurrentLocationFeatureKind,
  })
  const headingConeFeature = new Feature({
    geometry: createHeadingCone(center, location.headingDegrees, 55 * projectionScale),
    kind: 'heading-cone' satisfies CurrentLocationFeatureKind,
    headingVisible: location.headingDegrees != null,
  })
  const headingTriangleFeature = new Feature({
    geometry: createHeadingTriangle(center, location.headingDegrees, projectionScale),
    kind: 'heading-triangle' satisfies CurrentLocationFeatureKind,
    headingDegrees: location.headingDegrees,
  })
  const markerFeature = new Feature({
    geometry: new Point(center),
    kind: 'marker' satisfies CurrentLocationFeatureKind,
  })
  return {
    center,
    features: [accuracyFeature, headingConeFeature, headingTriangleFeature, markerFeature],
  }
}

export function createHeadingCone(
  center: number[],
  headingDegrees: number | null,
  lengthMeters: number,
): Polygon {
  if (headingDegrees == null) return new Polygon([])
  const normalizedHeading = normalizeMapHeading(headingDegrees)
  const halfAngle = 28
  const arc: number[][] = []
  for (let offset = -halfAngle; offset <= halfAngle; offset += 7) {
    const radians = (normalizedHeading + offset) * Math.PI / 180
    arc.push([
      center[0] + Math.sin(radians) * lengthMeters,
      center[1] + Math.cos(radians) * lengthMeters,
    ])
  }
  return new Polygon([[center, ...arc, center]])
}

/** Cone and triangle use the same north-clockwise heading geometry, so map rotation is applied exactly once. */
export function createHeadingTriangle(center: number[], headingDegrees: number | null, scale = 1): Polygon {
  if (headingDegrees == null) return new Polygon([])
  const heading = normalizeMapHeading(headingDegrees)
  const tip = directionalPoint(center, heading, 22 * scale)
  const left = directionalPoint(center, heading - 90, 6.5 * scale)
  const right = directionalPoint(center, heading + 90, 6.5 * scale)
  const baseCenter = directionalPoint(center, heading, 8 * scale)
  const leftBase = [baseCenter[0] + left[0] - center[0], baseCenter[1] + left[1] - center[1]]
  const rightBase = [baseCenter[0] + right[0] - center[0], baseCenter[1] + right[1] - center[1]]
  return new Polygon([[tip, leftBase, rightBase, tip]])
}

export function normalizeMapHeading(headingDegrees: number) {
  return ((headingDegrees % 360) + 360) % 360
}

function directionalPoint(center: number[], headingDegrees: number, distance: number) {
  const radians = headingDegrees * Math.PI / 180
  return [center[0] + Math.sin(radians) * distance, center[1] + Math.cos(radians) * distance]
}
