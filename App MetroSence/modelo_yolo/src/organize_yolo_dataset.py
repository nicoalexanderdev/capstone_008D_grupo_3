"""
Script para organizar dataset YOLO en train/val/test
Lee automáticamente el archivo classes.txt
Autor: Organización automática de dataset
Fecha: 2025-10-22
"""

import os
import shutil
import random
from pathlib import Path

def read_classes(classes_file):
    """
    Lee el archivo classes.txt y retorna la lista de clases
    """
    if not os.path.exists(classes_file):
        print(f"⚠️  Advertencia: No se encontró {classes_file}")
        return None
    
    with open(classes_file, 'r', encoding='utf-8') as f:
        classes = [line.strip() for line in f if line.strip()]
    
    print(f"\n✅ Clases cargadas desde {classes_file}:")
    for i, cls in enumerate(classes):
        print(f"   {i}: {cls}")
    
    return classes

def organize_yolo_dataset(
    images_dir,
    labels_dir,
    output_dir,
    classes_file=None,
    train_ratio=0.7,
    val_ratio=0.2,
    test_ratio=0.1,
    seed=42
):
    """
    Organiza imágenes y labels en estructura train/val/test para YOLO
    
    Args:
        images_dir: Directorio con las imágenes
        labels_dir: Directorio con los labels (.txt)
        output_dir: Directorio de salida
        classes_file: Ruta al archivo classes.txt (opcional)
        train_ratio: Proporción para entrenamiento (default: 0.7 = 70%)
        val_ratio: Proporción para validación (default: 0.2 = 20%)
        test_ratio: Proporción para test (default: 0.1 = 10%)
        seed: Semilla para reproducibilidad
    """
    
    print("=" * 70)
    print("🚀 ORGANIZADOR DE DATASET YOLO")
    print("=" * 70)
    
    # Leer clases desde classes.txt
    classes = None
    if classes_file:
        classes = read_classes(classes_file)
        if classes is None:
            print("   ⚠️  Continuando sin archivo classes.txt...")
            print("   Deberás editar manualmente el data.yaml después")
    
    # Verificar que las proporciones sumen 1
    assert abs(train_ratio + val_ratio + test_ratio - 1.0) < 0.001, \
        "Las proporciones deben sumar 1.0"
    
    # Verificar que los directorios existan
    images_path = Path(images_dir)
    labels_path = Path(labels_dir)
    
    if not images_path.exists():
        print(f"\n❌ ERROR: No se encontró el directorio de imágenes: {images_dir}")
        print(f"   Verifica que la ruta sea correcta")
        return
    
    if not labels_path.exists():
        print(f"\n❌ ERROR: No se encontró el directorio de labels: {labels_dir}")
        print(f"   Verifica que la ruta sea correcta")
        return
    
    print(f"\n✅ Directorio de imágenes encontrado: {images_path}")
    print(f"✅ Directorio de labels encontrado: {labels_path}")
    
    # Crear directorios de salida
    output_path = Path(output_dir)
    print(f"\n📁 Creando estructura de carpetas en: {output_path.absolute()}")
    
    for split in ['train', 'val', 'test']:
        (output_path / split / 'images').mkdir(parents=True, exist_ok=True)
        (output_path / split / 'labels').mkdir(parents=True, exist_ok=True)
    
    # Obtener lista de imágenes (soporta jpg, jpeg, png)
    print(f"\n🔍 Buscando imágenes en: {images_path}")
    image_extensions = ['.jpg', '.jpeg', '.png']
    image_files = []
    
    for ext in image_extensions:
        found = list(images_path.glob(f'*{ext}'))
        if found:
            print(f"   Encontradas {len(found)} imágenes con extensión {ext}")
        image_files.extend(found)
    
    if not image_files:
        print(f"\n❌ ERROR: No se encontraron imágenes en {images_dir}")
        print(f"   Extensiones buscadas: {', '.join(image_extensions)}")
        return
    
    print(f"\n📊 Total de imágenes encontradas: {len(image_files)}")
    
    # Filtrar solo imágenes que tengan su label correspondiente
    print(f"\n🔍 Verificando labels en: {labels_path}")
    valid_pairs = []
    missing_labels = []
    
    for img_file in image_files:
        label_file = labels_path / f"{img_file.stem}.txt"
        if label_file.exists():
            valid_pairs.append((img_file, label_file))
        else:
            missing_labels.append(img_file.name)
    
    if missing_labels:
        print(f"\n⚠️  {len(missing_labels)} imágenes sin label correspondiente:")
        for missing in missing_labels[:5]:  # Mostrar solo las primeras 5
            print(f"   - {missing}")
        if len(missing_labels) > 5:
            print(f"   ... y {len(missing_labels) - 5} más")
    
    if not valid_pairs:
        print(f"\n❌ ERROR: No se encontraron pares válidos imagen-label")
        print(f"   Verifica que:")
        print(f"   1. Las imágenes y labels tengan el mismo nombre base")
        print(f"   2. Los labels tengan extensión .txt")
        return
    
    print(f"\n✅ Total de pares imagen-label válidos: {len(valid_pairs)}")
    
    # Mezclar de manera aleatoria con seed para reproducibilidad
    random.seed(seed)
    random.shuffle(valid_pairs)
    
    # Calcular índices de división
    total = len(valid_pairs)
    train_end = int(total * train_ratio)
    val_end = train_end + int(total * val_ratio)
    
    splits = {
        'train': valid_pairs[:train_end],
        'val': valid_pairs[train_end:val_end],
        'test': valid_pairs[val_end:]
    }
    
    # Copiar archivos a sus respectivas carpetas
    print("\n📦 Copiando archivos...")
    for split_name, pairs in splits.items():
        print(f"\n   {split_name.upper()}:")
        for img_file, label_file in pairs:
            # Copiar imagen
            shutil.copy2(
                img_file,
                output_path / split_name / 'images' / img_file.name
            )
            # Copiar label
            shutil.copy2(
                label_file,
                output_path / split_name / 'labels' / label_file.name
            )
        percentage = (len(pairs) / total * 100)
        print(f"      ✓ {len(pairs)} pares copiados ({percentage:.1f}%)")
    
    # Crear archivo data.yaml para YOLO
    create_yaml(output_path, splits, classes)
    
    print("\n" + "=" * 70)
    print("✅ DATASET ORGANIZADO EXITOSAMENTE")
    print("=" * 70)
    print(f"\n📂 Ubicación: {output_path.absolute()}")
    print(f"\n📈 Distribución final:")
    print(f"   🎯 Train: {len(splits['train'])} imágenes ({len(splits['train'])/total*100:.1f}%)")
    print(f"   📊 Val:   {len(splits['val'])} imágenes ({len(splits['val'])/total*100:.1f}%)")
    print(f"   🧪 Test:  {len(splits['test'])} imágenes ({len(splits['test'])/total*100:.1f}%)")
    
    if classes:
        print(f"\n🏷️  Clases detectadas ({len(classes)}):")
        for i, cls in enumerate(classes):
            print(f"   {i}: {cls}")
    else:
        print("\n⚠️  Recuerda editar data.yaml con tus clases reales")
    
    print(f"\n🚀 Para entrenar:")
    print(f"   yolo train model=yolo11n.pt data=\"{output_path.absolute()}/data.yaml\" epochs=100")

def create_yaml(output_path, splits, classes=None):
    """
    Crea el archivo data.yaml necesario para entrenar YOLO
    """
    yaml_content = f"""# Dataset configuration for YOLO11n
# Generado automáticamente

path: {output_path.absolute()}  # ruta raíz del dataset
train: train/images  # ruta relativa al train
val: val/images      # ruta relativa al val
test: test/images    # ruta relativa al test (opcional)

"""
    
    if classes:
        yaml_content += f"# Clases (leídas desde classes.txt)\n"
        yaml_content += f"nc: {len(classes)}  # número de clases\n\n"
        yaml_content += "names:\n"
        for i, cls in enumerate(classes):
            yaml_content += f"  {i}: {cls}\n"
    else:
        yaml_content += "# Número de clases (ajusta según tu dataset)\n"
        yaml_content += "nc: 1  # CAMBIAR según tu número de clases\n\n"
        yaml_content += "# Nombres de las clases (ajusta según tu dataset)\n"
        yaml_content += "names:\n"
        yaml_content += "  0: objeto  # CAMBIAR según tus clases\n"
    
    yaml_content += f"""
# Estadísticas
train_samples: {len(splits['train'])}
val_samples: {len(splits['val'])}
test_samples: {len(splits['test'])}
"""
    
    yaml_path = output_path / 'data.yaml'
    with open(yaml_path, 'w', encoding='utf-8') as f:
        f.write(yaml_content)
    
    print(f"\n📝 Archivo data.yaml creado en: {yaml_path}")
    if not classes:
        print("   ⚠️  Recuerda actualizar 'nc' y 'names' según tus clases")

if __name__ == "__main__":
    
    # ============================================
    # CONFIGURACIÓN - AJUSTA ESTAS RUTAS
    # ============================================
    
    # IMPORTANTE: Para rutas de Windows, usa raw strings (r"...") o barras dobles (\\)
    # o barras simples hacia adelante (/)
    
    # Carpeta con las imágenes
    IMAGES_DIR = r"C:\Users\osesn\Documents\GitHub\capstone_008D_grupo_3\App MetroSence\modelo_yolo\dataset_balanced\images"
    
    # Carpeta con los labels .txt
    LABELS_DIR = r"C:\Users\osesn\Documents\GitHub\capstone_008D_grupo_3\App MetroSence\modelo_yolo\dataset_balanced\labels"
    
    # Archivo classes.txt (ajusta la ruta donde esté tu archivo)
    CLASSES_FILE = r"C:\Users\osesn\Downloads\OneDrive_2025-10-22\dataset_raw\classes.txt"

    
    # Carpeta de salida (se creará automáticamente)
    OUTPUT_DIR = "dataset_yolo_balanced_final"
    
    # Proporciones (ajusta si lo deseas)
    TRAIN_RATIO = 0.7  # 70% para entrenamiento
    VAL_RATIO = 0.2    # 20% para validación
    TEST_RATIO = 0.1   # 10% para test
    
    # ============================================
    # EJECUTAR ORGANIZACIÓN
    # ============================================
    
    print("\n")
    
    organize_yolo_dataset(
        images_dir=IMAGES_DIR,
        labels_dir=LABELS_DIR,
        output_dir=OUTPUT_DIR,
        classes_file=CLASSES_FILE,
        train_ratio=TRAIN_RATIO,
        val_ratio=VAL_RATIO,
        test_ratio=TEST_RATIO,
        seed=42  # Para reproducibilidad
    )
    
    print("\n✨ ¡Proceso completado!")