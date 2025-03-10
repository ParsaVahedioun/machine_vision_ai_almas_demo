(function() {
    'use strict';
    window.addEventListener('load', function() {
        // Fetch all the forms we want to apply custom Bootstrap validation styles to
        var forms = document.getElementsByClassName('needs-validation');
        // Loop over them and prevent submission
        var validation = Array.prototype.filter.call(forms, function(form) {
        form.addEventListener('submit', function(event) {
            if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
        });
      }, false);
 })();

 function changeLayout(columns) {
const videoGrid = document.getElementById('video-grid');
columns = parseInt(columns);

// پاک کردن ویدئوهای موجود
videoGrid.innerHTML = '';

// ایجاد ساختار گرید بر اساس تعداد انتخاب شده
videoGrid.style.display = 'grid';
videoGrid.style.gridTemplateColumns = `repeat(${Math.sqrt(columns)}, 1fr)`;

// ایجاد المانهای ویدئو جدید
for (let i = 0; i < columns; i++) {
    const videoWrapper = document.createElement('div');
    videoWrapper.className = 'video-item';
    
    const videoElement = document.createElement('img');
    videoElement.src = "{{ url_for('video_feed') }}";
    videoElement.className = 'img-fluid rounded shadow';
    videoElement.alt = `دوربین ${i + 1}`;
    
    videoWrapper.appendChild(videoElement);
    videoGrid.appendChild(videoWrapper);
}
}

// مقدار پیشفرض
changeLayout(1);

 // Fetch detected plates every second and update the UI
 function fetchPlates() {
        fetch('/plates')
            .then(response => response.json())
            .then(data => {
                const platesDiv = document.getElementById('plates');
                platesDiv.innerHTML = ''; // Clear previous data

                data.forEach(plate => {
                    const plateItem = document.createElement('div');
                    plateItem.className = 'plate-item';

                    // Create image element for the plate
                    const plateImage = document.createElement('img');
                    plateImage.src = plate.image_path; // Path to the plate image
                    plateImage.alt = 'Plate Image';
                    plateImage.style.width = '100px';
                    plateImage.style.height = '50px';
                    plateImage.style.marginRight = '10px';

                    // Create text element for plate number
                    const plateText = document.createElement('span');
                    plateText.textContent = `پلاک: ${plate.number}`;

                    // Append to plate item
                    plateItem.appendChild(plateImage);
                    plateItem.appendChild(plateText);

                    // Append to plates list
                    platesDiv.appendChild(plateItem);
                });
            })
            .catch(error => console.error('Error fetching plates:', error));
    }

    // Call fetchPlates every second
    setInterval(fetchPlates, 1000);

    // Submit plate form data to the backend
    document.getElementById('plate-form').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission

        // Collect form data
        const formData = new FormData(this);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        // Send data to the backend
        fetch('/submit_plate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(data).toString(),
        })
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                alert(result.message); // Show success message
                document.getElementById('plate-form').reset(); // Reset form
            } else {
                alert(result.message); // Show error message
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('خطا در ارسال اطلاعات!');
        });
    });

    function updatePersianDate() {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        locale: 'fa-IR'
    };
    
    const dateElement = document.getElementById('live-date');
    dateElement.textContent = new Date().toLocaleDateString('fa-IR', options);
}

// آپدیت هر 1 دقیقه
setInterval(updatePersianDate, 60000);
updatePersianDate(); // اجرای اولیه

    function updateServerDateTime() {
    fetch('/get_server_time')
        .then(response => response.json())
        .then(data => {
            const dateTimeString = `  ساعت: ${data.time}`;
            document.getElementById('server-date-time').textContent = dateTimeString;
        });
}

// آپدیت هر 1 ثانیه
setInterval(updateServerDateTime, 1000);
updateServerDateTime(); // اجرای اولیه
