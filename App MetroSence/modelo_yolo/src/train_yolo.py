"""
Script de ejemplo para entrenar YOLO11n
Ejecutar después de organizar el dataset
"""

from ultralytics import YOLO
import torch

def train_yolo11n(
    data_yaml="dataset_yolo_balanced_final/data.yaml",
    epochs=100,
    imgsz=640,
    batch=16,
    name="yolo11n_experiment"
):
    """
    Entrena un modelo YOLO11n
    
    Args:
        data_yaml: Ruta al archivo data.yaml
        epochs: Número de épocas de entrenamiento
        imgsz: Tamaño de la imagen (640 es estándar)
        batch: Tamaño del batch
        name: Nombre del experimento
    """
    
    print("=" * 60)
    print("🚀 ENTRENAMIENTO YOLO11n")
    print("=" * 60)
    
    # Verificar si hay GPU disponible
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"\n🖥️  Dispositivo: {device}")
    if device == 'cuda':
        print(f"   GPU: {torch.cuda.get_device_name(0)}")
    
    # Cargar modelo YOLO11n
    print("\n📥 Cargando modelo YOLO11n...")
    model = YOLO('yolo11n.pt')  # Se descargará automáticamente si no existe
    
    # Entrenar modelo
    print(f"\n🎯 Iniciando entrenamiento...")
    print(f"   Épocas: {epochs}")
    print(f"   Tamaño de imagen: {imgsz}")
    print(f"   Batch size: {batch}")
    
    results = model.train(
        data=data_yaml,
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        name=name,
        device=device,
        
        # Parámetros opcionales recomendados
        patience=50,        # Early stopping patience
        save=True,          # Guardar checkpoints
        save_period=10,     # Guardar cada 10 épocas
        plots=True,         # Generar gráficos
        
        # Augmentaciones (ajusta según tu caso)
        hsv_h=0.015,        # Variación de matiz
        hsv_s=0.7,          # Variación de saturación
        hsv_v=0.4,          # Variación de valor
        degrees=0.0,        # Rotación (grados)
        translate=0.1,      # Traslación
        scale=0.5,          # Escala
        shear=0.0,          # Cizallamiento
        perspective=0.0,    # Perspectiva
        flipud=0.0,         # Volteo vertical
        fliplr=0.5,         # Volteo horizontal
        mosaic=1.0,         # Mosaic augmentation
        mixup=0.0,          # Mixup augmentation
        copy_paste=0.0,     # Copy-paste augmentation
    )
    
    print("\n✅ ¡Entrenamiento completado!")
    print(f"📁 Resultados guardados en: runs/detect/{name}")
    
    # Evaluar en el conjunto de validación
    print("\n📊 Evaluando modelo en validación...")
    metrics = model.val()
    
    print("\n📈 Métricas:")
    print(f"   mAP50: {metrics.box.map50:.4f}")
    print(f"   mAP50-95: {metrics.box.map:.4f}")
    
    return model, results

def test_model(model_path, data_yaml):
    """
    Prueba el modelo entrenado en el conjunto de test
    """
    print("\n🧪 Probando modelo en conjunto de test...")
    model = YOLO(model_path)
    results = model.val(data=data_yaml, split='test')
    
    print("\n📊 Resultados en Test:")
    print(f"   mAP50: {results.box.map50:.4f}")
    print(f"   mAP50-95: {results.box.map:.4f}")
    
    return results

if __name__ == "__main__":
    
    # CONFIGURACIÓN - Ajusta estos parámetros
    DATA_YAML = "dataset_yolo_balanced_final/data.yaml"  # Ruta a tu data.yaml
    EPOCHS = 50                           # Número de épocas
    IMGSZ = 640                            # Tamaño de imagen
    BATCH = 8                             # Ajusta según tu GPU
    
    # Entrenar modelo
    model, results = train_yolo11n(
        data_yaml=DATA_YAML,
        epochs=EPOCHS,
        imgsz=IMGSZ,
        batch=BATCH,
        name="yolo11n_metrosence_50epochs"
    )
    
    # Después del entrenamiento, prueba en test set
    best_model_path = r"C:\Users\osesn\Documents\GitHub\capstone_008D_grupo_3\runs\detect\yolo11n_metrosence_50epochs\weights\best.pt"
    test_results = test_model(best_model_path, DATA_YAML)
    
    print("\n" + "=" * 60)
    print("✅ PROCESO COMPLETADO")
    print("=" * 60)
    print(f"\n📦 Mejor modelo guardado en: {best_model_path}")
    print("\n💡 Para hacer inferencia:")
    print(f"   from ultralytics import YOLO")
    print(f"   model = YOLO('{best_model_path}')")
    print(f"   results = model.predict('imagen.jpg')")