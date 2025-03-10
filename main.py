from flask import Flask, Response, render_template, jsonify , request , redirect , abort , url_for
import cv2
import threading
import os
import time  # Import the time module for delay
from camera_processor import CameraProcessor  # Import your CameraProcessor class
from flask_login import LoginManager
from datetime import datetime
import jdatetime
from flask_cors import CORS


login_manager = LoginManager()
app = Flask(__name__)
CORS(app)

# Initialize the CameraProcessor
object_model_path = "./model/heavy_detecte.pt"
char_model_path = "./model/yolov8n_char_new.pt"
output_dir = "./static/assets"
camera_processor = CameraProcessor(object_model_path, char_model_path, output_dir)

# Global variables for video streaming and control
lock = threading.Lock()
is_running = True  # Control variable to stop the video processing
detected_plates = []  # List to store detected plates with image paths

def generate_frames():
    """
    Generate frames from the camera and process them using CameraProcessor.
    """
    global is_running
    cap = cv2.VideoCapture("rtsp://admin:111111@192.168.31.6:554/mode=real&idc=1&ids=1")  # Open the IP camera stream
    # cap = cv2.VideoCapture("./model/test0.mp4")


    # Set frame skipping parameters
    frame_counter = 0
    skip_frames = 3  # Process 1 frame out of every 3 frames

    prev_frame_time = 0  # For calculating actual FPS
    while is_running:
        # Capture frame-by-frame
        success, frame = cap.read()
        if not success:
            break

        # Increment frame counter
        frame_counter += 1
        img = cv2.resize(frame, (640, 480))
        # Skip frames based on the skip_frames value
        if frame_counter % skip_frames != 0:
            continue  # Skip this frame

        # Calculate FPS
        current_time = time.time()
        fps = 1 / (current_time - prev_frame_time)
        prev_frame_time = current_time

        # Process the frame using CameraProcessor
        with lock:
            processed_frame, plate_info = camera_processor.process_video_frame(frame)
            if plate_info and plate_info['number'] not in [plate['number'] for plate in detected_plates]:
                detected_plates.append(plate_info)

        # Apply Gaussian blur to reduce noise (optional)
        processed_frame = cv2.GaussianBlur(processed_frame, (5, 5), 0)

        # Encode the processed frame as JPEG
        ret, buffer = cv2.imencode('.jpg', processed_frame)
        if not ret:
            continue

        # Yield the frame as a byte stream
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request == 'POST':
  # Perform login authentication
        username = request.form['username']
        password = request.form['password']

  # Check if the credentials are valid
        if username == 'admin' and password == '1234':
     # Redirect to the user's dashboard on successful login
            return redirect(url_for('index'))
        else:
     # Abort the request with a 401 Unauthorized status code
            abort(401)

    return render_template('login.html')


@app.route('/')
def index():
    now = jdatetime.datetime.now()
    formatted_date = now.strftime("%A %d %B %Y")
    return render_template('index.html', persian_date=formatted_date)



@app.route('/get_server_time')
def get_server_time():

    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return jsonify({
        'date': datetime.now().strftime("%Y-%m-%d"),
        'time': datetime.now().strftime("%H:%M:%S")
    })

@app.route('/video_feed')
def video_feed():
    return Response(
        generate_frames(),
        mimetype='multipart/x-mixed-replace; boundary=frame',
        headers={
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    )

@app.route('/camera_settings')
def camera_setting():
    return render_template('camera-setting.html')

@app.route('/setting')
def setting():
    return render_template('setting.html')

@app.route('/traffic')
def traffic():
    return render_template('traffice.html')

@app.route('/camera_feed/<int:camera_id>')
def camera_feed(camera_id):
    """
    استریم ویدیو برای دوربین خاص
    """

    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/situation')
def situation():
    return render_template('situation.html')


@app.route('/requests')
def request():
    return render_template('request.html')

@app.route('/factor')
def factor():
    return render_template('factor.html')

@app.route('/payment')
def payment():
    return render_template('payment.html')


@app.route('/plates', methods=['GET'])
def get_plates():
    """
    Return the list of detected plates as JSON, including their image paths.
    """
    return jsonify(detected_plates)

@app.route('/stop', methods=['POST'])
def stop():
    """
    Stop the video processing when the stop button is pressed.
    """
    global is_running
    is_running = False
    return "Video processing stopped."

@app.errorhandler(401)
def unauthorized_error(error):
    return render_template('401.html'), 401

if __name__ == '__main__':
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    # Start the Flask app
    app.run(port=6985, debug=True)