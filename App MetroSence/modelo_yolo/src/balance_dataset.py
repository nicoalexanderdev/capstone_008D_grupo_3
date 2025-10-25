"""
Script para balancear dataset YOLO mediante Data Augmentation
Aumenta automáticamente las clases minoritarias
Autor: Data Augmentation para YOLO
Fecha: 2025-10-25
"""

import os
import cv2
import numpy as np
import random
import albumentations as A
from pathlib import Path
from collections import Counter
import shutil

class YOLODatasetBalancer:
    """
    Balancea un dataset YOLO aplicando augmentation a clases minoritarias
    """
    
    def __init__(self, images_dir, labels_dir, classes_file, output_dir=None):
        """
        Args:
            images_dir: Directorio con imágenes
            labels_dir: Directorio con labels YOLO (.txt)
            classes_file: Archivo classes.txt con nombres de clases
            output_dir: Directorio de salida (si None, usa images_dir + "_balanced")
        """
        self.images_dir = Path(images_dir)
        self.labels_dir = Path(labels_dir)
        self.classes_file = Path(classes_file)
        
        if output_dir is None:
            output_dir = str(self.images_dir) + "_balanced"
        self.output_dir = Path(output_dir)
        
        # Cargar clases
        self.classes = self._load_classes()
        self.num_classes = len(self.classes)
        
        # Pipeline de augmentation
        self.transform = self._create_augmentation_pipeline()
        
    def _load_classes(self):
        """Carga el archivo classes.txt"""
        if not self.classes_file.exists():
            raise FileNotFoundError(f"No se encontró {self.classes_file}")
        
        with open(self.classes_file, 'r', encoding='utf-8') as f:
            classes = [line.strip() for line in f if line.strip()]
        
        print(f"\n✅ Clases cargadas: {classes}")
        return classes
    
    def _create_augmentation_pipeline(self):
        """
        Crea pipeline de augmentation usando Albumentations
        Preserva las bounding boxes en formato YOLO
        """
        return A.Compose([
            # Transformaciones geométricas
            A.HorizontalFlip(p=0.5),
            A.Rotate(limit=15, p=0.5),
            A.ShiftScaleRotate(
                shift_limit=0.1,
                scale_limit=0.15,
                rotate_limit=10,
                p=0.5
            ),
            
            # Transformaciones de color
            A.RandomBrightnessContrast(
                brightness_limit=0.2,
                contrast_limit=0.2,
                p=0.5
            ),
            A.HueSaturationValue(
                hue_shift_limit=10,
                sat_shift_limit=15,
                val_shift_limit=10,
                p=0.3
            ),
            
            # Efectos
            A.GaussNoise(var_limit=(10.0, 50.0), p=0.3),
            A.Blur(blur_limit=3, p=0.2),
            
        ], bbox_params=A.BboxParams(
            format='yolo',
            label_fields=['class_labels'],
            min_visibility=0.3  # Descarta boxes si < 30% visible
        ))
    
    def analyze_dataset(self):
        """
        Analiza el dataset y cuenta instancias por clase
        Returns: dict con conteo por clase
        """
        print("\n" + "="*70)
        print("📊 ANALIZANDO DATASET")
        print("="*70)
        
        class_counts = Counter()
        label_files = list(self.labels_dir.glob("*.txt"))
        
        print(f"\n🔍 Analizando {len(label_files)} archivos de labels...")
        
        for label_file in label_files:
            with open(label_file, 'r') as f:
                for line in f:
                    parts = line.strip().split()
                    if parts:
                        # Convertir a float primero y luego a int para manejar '1.0'
                        class_id = int(float(parts[0]))
                        class_counts[class_id] += 1
        
        # Mostrar estadísticas
        print(f"\n📈 Distribución actual:")
        print(f"{'Clase':<20} {'ID':<5} {'Instancias':<12} {'Barra'}")
        print("-" * 70)
        
        max_count = max(class_counts.values()) if class_counts else 1
        
        for class_id in range(self.num_classes):
            count = class_counts.get(class_id, 0)
            class_name = self.classes[class_id]
            bar_length = int(40 * count / max_count)
            bar = "█" * bar_length
            print(f"{class_name:<20} {class_id:<5} {count:<12} {bar}")
        
        total = sum(class_counts.values())
        print("-" * 70)
        print(f"{'TOTAL':<20} {'':<5} {total:<12}")
        
        return class_counts
    
    def calculate_augmentation_needed(self, class_counts, target_ratio=0.5):
        """
        Calcula cuántas imágenes aumentadas se necesitan por clase
        
        Args:
            class_counts: dict con conteo actual por clase
            target_ratio: ratio objetivo respecto a la clase mayoritaria (0.5 = 50%)
        
        Returns: dict con número de augmentations necesarias por clase
        """
        if not class_counts:
            return {}
        
        max_count = max(class_counts.values())
        target_count = int(max_count * target_ratio)
        
        aug_needed = {}
        for class_id in range(self.num_classes):
            current = class_counts.get(class_id, 0)
            if current < target_count and current > 0:
                aug_needed[class_id] = target_count - current
        
        print(f"\n🎯 Objetivo: {target_ratio*100:.0f}% de la clase mayoritaria ({target_count} instancias)")
        print(f"\n📋 Augmentations necesarias:")
        
        for class_id, needed in aug_needed.items():
            class_name = self.classes[class_id]
            current = class_counts.get(class_id, 0)
            print(f"   {class_name:<20} {current:>4} → {target_count:>4} (+{needed})")
        
        return aug_needed
    
    def _yolo_to_albumentations(self, yolo_bbox):
        """Convierte YOLO bbox a formato Albumentations"""
        # YOLO: [x_center, y_center, width, height] (normalizados)
        # Ya está en formato correcto para Albumentations
        return [float(x) for x in yolo_bbox]
    
    def _read_yolo_labels(self, label_file):
        """Lee archivo de labels YOLO"""
        bboxes = []
        class_labels = []
        
        with open(label_file, 'r') as f:
            for line in f:
                parts = line.strip().split()
                if parts:
                    # Convertir a float primero y luego a int para manejar '1.0'
                    class_id = int(float(parts[0]))
                    bbox = [float(x) for x in parts[1:5]]
                    bboxes.append(bbox)
                    class_labels.append(class_id)
        
        return bboxes, class_labels
    
    def _write_yolo_labels(self, label_file, bboxes, class_labels):
        """Escribe archivo de labels YOLO"""
        with open(label_file, 'w') as f:
            for bbox, class_id in zip(bboxes, class_labels):
                # Asegurar que class_id sea entero
                class_id = int(class_id)
                # YOLO format: class_id x_center y_center width height
                line = f"{class_id} {bbox[0]:.6f} {bbox[1]:.6f} {bbox[2]:.6f} {bbox[3]:.6f}\n"
                f.write(line)
    
    def augment_image(self, image_path, label_path, class_id_target, num_augmentations=1):
        """
        Genera versiones aumentadas de una imagen que contiene la clase objetivo
        
        Returns: lista de tuplas (imagen_aug, labels_aug)
        """
        # Leer imagen
        image = cv2.imread(str(image_path))
        if image is None:
            print(f"⚠️  Error leyendo imagen: {image_path}")
            return []
        
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Leer labels
        bboxes, class_labels = self._read_yolo_labels(label_path)
        
        # Verificar que la imagen contiene la clase objetivo
        if class_id_target not in class_labels:
            return []
        
        augmented = []
        attempts = 0
        max_attempts = num_augmentations * 3  # Intentar hasta 3x en caso de fallos
        
        while len(augmented) < num_augmentations and attempts < max_attempts:
            attempts += 1
            
            try:
                # Aplicar transformación
                transformed = self.transform(
                    image=image,
                    bboxes=bboxes,
                    class_labels=class_labels
                )
                
                # Verificar que no se perdieron todas las boxes
                if transformed['bboxes']:
                    augmented.append((
                        transformed['image'],
                        transformed['bboxes'],
                        transformed['class_labels']
                    ))
            except Exception as e:
                # Algunas transformaciones pueden fallar con ciertas imágenes
                continue
        
        return augmented
    
    def balance_dataset(self, target_ratio=0.5, max_augmentations_per_image=5):
        """
        Balancea el dataset completo
        
        Args:
            target_ratio: ratio objetivo respecto a clase mayoritaria
            max_augmentations_per_image: máximo de augmentations por imagen original
        """
        print("\n" + "="*70)
        print("⚖️  BALANCEANDO DATASET")
        print("="*70)
        
        # Analizar dataset
        class_counts = self.analyze_dataset()
        aug_needed = self.calculate_augmentation_needed(class_counts, target_ratio)
        
        if not aug_needed:
            print("\n✅ El dataset ya está balanceado!")
            return
        
        # Crear directorios de salida
        output_images = self.output_dir / "images"
        output_labels = self.output_dir / "labels"
        output_images.mkdir(parents=True, exist_ok=True)
        output_labels.mkdir(parents=True, exist_ok=True)
        
        print(f"\n📁 Directorio de salida: {self.output_dir}")
        
        # Copiar dataset original
        print(f"\n📦 Copiando dataset original...")
        image_files = list(self.images_dir.glob("*.[jJpP][pPnN][gG]*"))
        
        for img_file in image_files:
            shutil.copy2(img_file, output_images / img_file.name)
            
            label_file = self.labels_dir / f"{img_file.stem}.txt"
            if label_file.exists():
                shutil.copy2(label_file, output_labels / label_file.name)
        
        print(f"   ✓ {len(image_files)} imágenes originales copiadas")
        
        # Generar augmentations
        print(f"\n🔄 Generando imágenes aumentadas...")
        
        for class_id, num_needed in aug_needed.items():
            class_name = self.classes[class_id]
            print(f"\n   Procesando clase: {class_name} (ID: {class_id})")
            
            # Encontrar todas las imágenes que contienen esta clase
            candidate_images = []
            
            for label_file in self.labels_dir.glob("*.txt"):
                with open(label_file, 'r') as f:
                    content = f.read()
                    if f"\n{class_id} " in f"\n{content}" or content.startswith(f"{class_id} "):
                        img_name = label_file.stem
                        img_candidates = list(self.images_dir.glob(f"{img_name}.*"))
                        if img_candidates:
                            candidate_images.append((img_candidates[0], label_file))
            
            if not candidate_images:
                print(f"      ⚠️  No se encontraron imágenes con clase {class_name}")
                continue
            
            print(f"      Imágenes candidatas: {len(candidate_images)}")
            
            # Calcular augmentations por imagen
            augs_per_image = min(
                max_augmentations_per_image,
                (num_needed // len(candidate_images)) + 1
            )
            
            generated = 0
            random.shuffle(candidate_images)
            
            for img_path, label_path in candidate_images:
                if generated >= num_needed:
                    break
                
                # Generar augmentations
                augmented = self.augment_image(
                    img_path,
                    label_path,
                    class_id,
                    num_augmentations=augs_per_image
                )
                
                # Guardar augmentations
                for idx, (aug_img, aug_bboxes, aug_labels) in enumerate(augmented):
                    if generated >= num_needed:
                        break
                    
                    # Nombre único
                    base_name = img_path.stem
                    aug_name = f"{base_name}_aug{class_id}_{generated}"
                    
                    # Guardar imagen
                    aug_img_bgr = cv2.cvtColor(aug_img, cv2.COLOR_RGB2BGR)
                    output_img_path = output_images / f"{aug_name}.jpg"
                    cv2.imwrite(str(output_img_path), aug_img_bgr)
                    
                    # Guardar labels
                    output_label_path = output_labels / f"{aug_name}.txt"
                    self._write_yolo_labels(output_label_path, aug_bboxes, aug_labels)
                    
                    generated += 1
            
            print(f"      ✓ Generadas {generated} imágenes aumentadas")
        
        # Estadísticas finales
        print("\n" + "="*70)
        print("✅ BALANCEO COMPLETADO")
        print("="*70)
        print(f"\n📂 Dataset balanceado guardado en: {self.output_dir.absolute()}")
        
        # Analizar dataset balanceado
        print(f"\n📊 Analizando dataset balanceado...")
        original_dir = (self.images_dir, self.labels_dir)
        self.images_dir = output_images
        self.labels_dir = output_labels
        
        new_counts = self.analyze_dataset()
        
        # Restaurar directorios originales
        self.images_dir, self.labels_dir = original_dir


def clean_labels_format(labels_dir):
    """
    Limpia archivos de labels convirtiendo class_ids flotantes a enteros
    Útil si ya generaste el dataset con el error
    """
    print("\n" + "="*70)
    print("🧹 LIMPIANDO FORMATO DE LABELS")
    print("="*70)
    
    labels_path = Path(labels_dir)
    label_files = list(labels_path.glob("*.txt"))
    
    print(f"\n🔍 Revisando {len(label_files)} archivos...")
    
    fixed_count = 0
    
    for label_file in label_files:
        try:
            # Leer contenido
            with open(label_file, 'r') as f:
                lines = f.readlines()
            
            # Verificar si necesita limpieza
            needs_fix = False
            fixed_lines = []
            
            for line in lines:
                parts = line.strip().split()
                if parts:
                    # Verificar si class_id es flotante
                    class_id_str = parts[0]
                    if '.' in class_id_str:
                        needs_fix = True
                        class_id = int(float(class_id_str))
                        bbox = parts[1:5]
                        fixed_line = f"{class_id} {' '.join(bbox)}\n"
                        fixed_lines.append(fixed_line)
                    else:
                        fixed_lines.append(line)
            
            # Escribir si necesita corrección
            if needs_fix:
                with open(label_file, 'w') as f:
                    f.writelines(fixed_lines)
                fixed_count += 1
                
        except Exception as e:
            print(f"⚠️  Error procesando {label_file.name}: {e}")
            continue
    
    print(f"\n✅ Archivos corregidos: {fixed_count}/{len(label_files)}")
    print("="*70)


def main():
    """
    Función principal - Configuración aquí
    """
    
    print("\n")
    print("="*70)
    print("⚖️  YOLO DATASET BALANCER")
    print("="*70)
    
    # ============================================
    # CONFIGURACIÓN - AJUSTA ESTAS RUTAS
    # ============================================
    
    # Ruta al dataset ORIGINAL (antes de organizar)
    IMAGES_DIR = r"C:\Users\osesn\Downloads\OneDrive_2025-10-22\dataset_raw\IMG DATASET"
    LABELS_DIR = r"C:\Users\osesn\Downloads\OneDrive_2025-10-22\dataset_raw\LABELS"
    CLASSES_FILE = r"C:\Users\osesn\Downloads\OneDrive_2025-10-22\dataset_raw\classes.txt"
    
    # Directorio de salida (se creará automáticamente)
    OUTPUT_DIR = "dataset_balanced"
    
    # Parámetros de balanceo
    TARGET_RATIO = 0.5  # Llevar clases minoritarias al 50% de la mayoritaria
    MAX_AUG_PER_IMAGE = 5  # Máximo 5 augmentations por imagen
    
    # ============================================
    # MODO DE OPERACIÓN
    # ============================================
    
    # Si ya generaste el dataset y tienes el error de '1.0', 
    # cambia esto a True para solo limpiar los labels
    CLEAN_EXISTING_DATASET = True
    CLEAN_LABELS_DIR = r"dataset_balanced\labels"
    
    # ============================================
    
    if CLEAN_EXISTING_DATASET:
        # Solo limpiar dataset existente
        print("\n🧹 Modo: Limpieza de dataset existente")
        clean_labels_format(CLEAN_LABELS_DIR)
        print("\n✨ ¡Limpieza completada!")
        return
    
    # Modo normal: generar dataset balanceado
    try:
        # Crear balanceador
        balancer = YOLODatasetBalancer(
            images_dir=IMAGES_DIR,
            labels_dir=LABELS_DIR,
            classes_file=CLASSES_FILE,
            output_dir=OUTPUT_DIR
        )
        
        # Ejecutar balanceo
        balancer.balance_dataset(
            target_ratio=TARGET_RATIO,
            max_augmentations_per_image=MAX_AUG_PER_IMAGE
        )
        
        print("\n✨ ¡Proceso completado!")
        print(f"\n🚀 Siguiente paso:")
        print(f"   Usa el script organize_dataset.py con el dataset balanceado:")
        print(f"   IMAGES_DIR = r\"{OUTPUT_DIR}/images\"")
        print(f"   LABELS_DIR = r\"{OUTPUT_DIR}/labels\"")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()