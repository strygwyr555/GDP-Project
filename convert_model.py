import os
import sys
from pathlib import Path

def check_dependencies():
    try:
        import tensorflow as tf
        import tensorflowjs as tfjs
        print(f"TensorFlow version: {tf.__version__}")
        print(f"TensorFlow.js version: {tfjs.__version__}")
        return True
    except ImportError as e:
        print(f"Error importing dependencies: {str(e)}")
        print("Please install required packages using:")
        print("pip install tensorflow tensorflowjs")
        return False

def convert_model():
    if not check_dependencies():
        return

    try:
        from tensorflow.keras.models import load_model
        import tensorflowjs as tfjs

        # Define paths
        current_dir = Path(__file__).parent
        model_path = current_dir.parent / 'my_model.keras'
        output_dir = current_dir / 'models'

        # Verify model file exists
        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found at: {model_path}")

        # Create output directory
        output_dir.mkdir(parents=True, exist_ok=True)

        print(f"Loading model from: {model_path}")
        model = load_model(str(model_path))
        
        print(f"Converting model and saving to: {output_dir}")
        tfjs.converters.save_keras_model(model, str(output_dir))
        print("Model conversion completed successfully!")

    except Exception as e:
        print(f"Error during model conversion: {str(e)}")
        print(f"Python version: {sys.version}")
        print(f"Current working directory: {os.getcwd()}")

if __name__ == "__main__":
    convert_model()