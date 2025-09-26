import os

# --- CONFIGURACIÓN ---

# 1. Nombre del archivo de salida que se creará.
output_filename = "project_code.txt"

# 2. Nombre de la carpeta raíz de tu proyecto.
project_root = "poker-replayer"

# 3. Lista de todos los archivos de tu proyecto que quieres incluir.
# IMPORTANTE: Si añades o eliminas archivos en tu proyecto, ¡debes actualizar esta lista!
file_paths = [
    "index.html",
    "package.json",
    "package-lock.json",
    "vite.config.js",
    "src/App.vue",
    "src/main.js",
    "src/i18n.js",
    "src/styles.css",
    "src/locales/en.json",
    "src/locales/es.json",
    "src/store/game.js",
    "src/store/useChartsStore.js",
    "src/store/useSessionStore.js",
    "src/store/useSettingsStore.js",
    "src/store/useTripStore.js",
    "src/components/ActionPanel.vue",
    "src/components/CardPicker.vue",
    "src/components/ChipStack.vue",
    "src/components/ConfigurationModal.vue",
    "src/components/DisplayOptions.vue",
    "src/components/EndSessionModal.vue",
    "src/components/HelloWorld.vue",
    "src/components/Player.vue",
    "src/components/PlayingCard.vue",
    "src/components/PokerTable.vue",
    "src/components/SessionChart.vue",
    "src/views/ChartsView.vue",
    "src/views/CommunityView.vue",
    "src/views/CurrentHandView.vue",
    "src/views/LiveSessionView.vue",
    "src/views/SavedHandsView.vue",
    "src/views/SavedSessionsView.vue",
    "src/views/SavedTripsView.vue",
    "src/views/SettingsView.vue",
    "src/views/SummaryView.vue",
]

# --- LÓGICA DEL SCRIPT ---

def generate_code_txt():
    """
    Lee todos los archivos de la lista y los une en un solo archivo de texto.
    """
    all_content = []
    # Obtiene el directorio donde se está ejecutando el script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.join(script_dir, project_root)

    print(f"Iniciando la recopilación de archivos del proyecto '{project_root}'...")

    try:
        # Primero, procesamos los archivos que están en la raíz del proyecto
        root_files = [f for f in file_paths if "/" not in f and "\\" not in f]
        for file_name in root_files:
            full_path = os.path.join(project_dir, file_name)
            
            print(f"Leyendo archivo raíz: {full_path}")
            
            header = f"\n=================================== FILE: ./{project_root}/{file_name} ===================================\n\n"
            all_content.append(header)
            
            with open(full_path, 'r', encoding='utf-8') as infile:
                content = infile.read()
                all_content.append(content)

        # Luego, procesamos los archivos en subdirectorios
        sub_files = [f for f in file_paths if "/" in f or "\\" in f]
        for file_path in sub_files:
            # Normalizamos los separadores para que funcione en cualquier SO
            normalized_path = file_path.replace("/", os.sep).replace("\\", os.sep)
            full_path = os.path.join(project_dir, normalized_path)
            
            print(f"Leyendo archivo: {full_path}")
            
            header = f"\n=================================== FILE: ./{project_root}/{file_path} ===================================\n\n"
            all_content.append(header)
            
            with open(full_path, 'r', encoding='utf-8') as infile:
                content = infile.read()
                all_content.append(content)

        # Escribimos todo al archivo de salida
        output_path = os.path.join(script_dir, output_filename)
        with open(output_path, 'w', encoding='utf-8') as outfile:
            outfile.write("".join(all_content))
            
        print("\n¡Proceso completado con éxito!")
        print(f"Se ha generado el archivo '{output_filename}' con todo el código.")

    except FileNotFoundError as e:
        print(f"\nERROR: No se pudo encontrar el archivo: {e.filename}")
        print("Por favor, asegúrate de que el script '1.py' esté en la carpeta correcta y que la lista 'file_paths' esté actualizada y sea correcta.")
    except Exception as e:
        print(f"\nHa ocurrido un error inesperado: {e}")

if __name__ == "__main__":
    generate_code_txt()