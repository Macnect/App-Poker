import os

# --- CONFIGURACIÓN ---
# Edita estas listas para personalizar qué se incluye y qué se excluye.

# 1. Rutas que quieres incluir en el análisis.
#    Puede ser una mezcla de archivos individuales y carpetas completas.
PATHS_TO_INCLUDE = [
    'public',
    'src',
    'index.html',
    'package.json',
    'vite.config.js',
    'README.md'
]

# 2. Patrones a excluir. El script ignorará cualquier archivo o carpeta que coincida.
PATTERNS_TO_EXCLUDE = [
    'node_modules',   # Excluye la carpeta de dependencias
    'dist',           # Excluye la carpeta de compilación
    '.git',           # Excluye la carpeta de control de versiones
    '__pycache__',    # Excluye la caché de Python
    '.DS_Store',      # Excluye archivos de sistema de macOS
    'package-lock.json', # Es muy largo y redundante con package.json
    '.log'            # Excluye cualquier archivo que termine en .log
]

# 3. Nombre del archivo de salida.
OUTPUT_FILENAME = 'project_code.txt'

# --- FIN DE LA CONFIGURACIÓN ---


def should_exclude(path, exclude_patterns):
    """Verifica si una ruta de archivo o carpeta debe ser excluida."""
    path_parts = path.replace('\\', '/').split('/')
    for pattern in exclude_patterns:
        # Excluir si alguna parte de la ruta coincide exactamente con un patrón (ej: 'node_modules')
        if pattern in path_parts:
            return True
        # Excluir si la ruta termina con un patrón (ej: '.log')
        if path.endswith(pattern):
            return True
    return False

def get_all_filepaths(include_paths, exclude_patterns):
    """Recopila todas las rutas de archivos válidas, respetando las exclusiones."""
    all_files = set() # Usamos un set para evitar duplicados
    for path in include_paths:
        if should_exclude(path, exclude_patterns):
            continue
        
        if os.path.isfile(path):
            all_files.add(path)
        elif os.path.isdir(path):
            for root, dirs, files in os.walk(path):
                # Excluir carpetas de la búsqueda para ser más eficiente
                dirs[:] = [d for d in dirs if not should_exclude(os.path.join(root, d), exclude_patterns)]
                
                for file in files:
                    file_path = os.path.join(root, file)
                    if not should_exclude(file_path, exclude_patterns):
                        all_files.add(file_path)
    return sorted(list(all_files))

def centralize_code(filepaths, output_file):
    """Escribe el contenido de todos los archivos encontrados en un único fichero de texto."""
    try:
        with open(output_file, 'w', encoding='utf-8', errors='ignore') as outfile:
            outfile.write("=" * 35 + " RESUMEN DEL PROYECTO " + "=" * 35 + "\n\n")
            for filepath in filepaths:
                normalized_path = filepath.replace('\\', '/')
                header = f"--- INICIO DEL ARCHIVO: {normalized_path} ---"
                outfile.write(header + '\n\n')
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as infile:
                        outfile.write(infile.read())
                    outfile.write('\n\n' + "-" * len(header) + '\n\n')
                except Exception as e:
                    outfile.write(f"*** ERROR al leer el archivo: {e} ***\n\n")
        print(f"¡Éxito! El código del proyecto se ha centralizado en '{output_file}'")
    except Exception as e:
        print(f"*** ERROR al crear el archivo de salida '{output_file}': {e} ***")

if __name__ == "__main__":
    print("Iniciando la recopilación de archivos del proyecto...")
    
    # Asegurarse de que el script se ejecuta desde el directorio correcto
    project_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(project_dir)
    
    all_project_files = get_all_filepaths(PATHS_TO_INCLUDE, PATTERNS_TO_EXCLUDE)
    
    if not all_project_files:
        print("No se encontraron archivos válidos. Revisa la configuración de 'PATHS_TO_INCLUDE' en el script.")
    else:
        print(f"Se encontraron {len(all_project_files)} archivos. Escribiendo en '{OUTPUT_FILENAME}'...")
        centralize_code(all_project_files, OUTPUT_FILENAME)