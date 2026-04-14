export interface Detection {
  class_id: number
  class_name: string
  confidence: number
  bbox: [number, number, number, number] // [x1, y1, x2, y2]
}

export interface ApiResponse {
  detections: Detection[]
}

export interface HealthResponse {
  status: string
  model: string
  model_loaded: boolean
}
