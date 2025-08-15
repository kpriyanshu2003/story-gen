import os
import requests

# from openai import OpenAI
# from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_file

# load_dotenv()
# client = OpenAI(
#     base_url="https://openrouter.ai/api/v1",
#     api_key=os.getenv("OPENROUTER_API_KEY"),
# )
app = Flask(__name__, static_folder="static")


@app.route("/")
def index():
    """Load the home page"""
    return send_file("static/index.html")


@app.route("/ask", methods=["POST"])
def ask():
    """Handle POST request with five fields and return JSON response"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided", "status": "error"}), 400

        prompt = data.get("prompt")
        genre = data.get("genre")
        length = data.get("length")
        age_group = data.get("ageGroup")
        emotion = data.get("emotion")

        missing_fields = [
            key
            for key in ["prompt", "genre", "length", "ageGroup", "emotion"]
            if not data.get(key)
        ]
        if missing_fields:
            return (
                jsonify(
                    {
                        "error": f"Missing fields: {', '.join(missing_fields)}",
                        "status": "error",
                    }
                ),
                400,
            )

        pre_prompt = f'Generate a {genre} story that is {length} long, suitable for a {age_group} audience, and evokes a sense of {emotion}. The story should be engaging and memorable. Prompt: "{prompt}"'
        generated_story = generate_story(pre_prompt)
        if not generated_story:
            return (
                jsonify({"error": "Failed to generate story", "status": "error"}),
                500,
            )

        # TODO : Implement the actual speech output logic
        # response = requests.post("http://localhost:4000", json={})
        # if response.status_code != 200:
        #     return (
        #         jsonify({"error": "Failed speech output", "status": "error"}),
        #         500,
        #     )

        response_data = {
            "status": "success",
            "message": "Story generated successfully",
            "story": generated_story,
        }
        return jsonify(response_data), 200

    except Exception as e:
        return jsonify({"error": str(e), "status": "error"}), 500


# TODO : Implement the actual story generation logic
def generate_story(pre_prompt):
    """story generation function"""
    # completion = client.chat.completions.create(
    #     model="openai/gpt-oss-20b:free",
    #     messages=[{"role": "user", "content": pre_prompt}],
    # )
    # return completion.choices[0].message.content
    return "hello world"


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
