import os
import pyttsx3
from flask_cors import CORS
from langdetect import detect
from dotenv import load_dotenv
import speech_recognition as sr
import google.generativeai as genai
from flask import Flask, request, jsonify
from deep_translator import GoogleTranslator

# Load environment variables
load_dotenv()

# Retrieve API key securely
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
if not GOOGLE_API_KEY:
    raise ValueError("Google API Key not found. Set it in the environment variables or .env file.")

# Configure Generative AI with API Key
genai.configure(api_key=GOOGLE_API_KEY)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Initialize services
engine = pyttsx3.init()
translator = GoogleTranslator(source='auto', target='en')
recognizer = sr.Recognizer()

# Function to detect language
def detect_language(text):
    return detect(text)

# Function to translate text if needed
def translate_if_needed(text, target_lang='en'):
    detected_lang = detect_language(text)
    if detected_lang != target_lang:
        return translator.translate(text), detected_lang
    return text, detected_lang

# Function to convert text to speech
def speak(text):
    engine.say(text)
    engine.runAndWait()

# AI chatbot response function
def chatbot_response(user_input):
    model = genai.GenerativeModel('gemini-2.0-flash')
    try:
        # Translate user input if necessary
        user_input, user_lang = translate_if_needed(user_input, 'en')
        # Generate AI response
        response = model.generate_content(user_input).text
        # Translate response back if needed
        if user_lang != 'en':
            response = translator.translate(response)
        return response
    except Exception as e:
        return f"Error: {str(e)}"

# API endpoint for chatbot
@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json  # Get JSON input from frontend
    user_message = data.get("message", "")
    if not user_message:
        return jsonify({"error": "Message is required"}), 400
    bot_response = chatbot_response(user_message)
    return jsonify({"response": bot_response})

# Run the Flask server
if __name__ == "__main__":
    # Use PYTHON_PORT environment variable or default to 5000
    port = int(os.getenv("PYTHON_PORT", 5000))
    app.run(debug=True, port=port)
