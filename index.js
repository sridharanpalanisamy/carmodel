const fordCars = [
    {
        model: "Ford Model T",
        year: "1908",
        fuelType: "Petrol",
        engine: "2.9L I4",
        topSpeed: "72 km/h",
        mileage: "18 km/l",
        description: "The Ford Model T revolutionized the automobile industry with its affordability and mass production.",
        image: "ford-model-t.png"
    },
    {
        model: "Ford Model A",
        year: "1927",
        fuelType: "Petrol",
        engine: "3.3L L-Head I4",
        topSpeed: "104 km/h",
        mileage: "15 km/l",
        description: "A successor to the Model T, the Ford Model A introduced new styling and technical advancements.",
        image: "ford_model_a.png"
    },
    {
        model: "Ford Deluxe Coupe",
        year: "1940",
        fuelType: "Petrol",
        engine: "3.6L V8",
        topSpeed: "140 km/h",
        mileage: "10 km/l",
        description: "A stylish and powerful coupe, the Ford Deluxe was popular for its V8 engine and elegant design.",
        image: "ford_deluxe.png"
    }
];

            document.addEventListener("DOMContentLoaded", function () {
    const images = document.querySelectorAll(".sliderImage"); // Use class instead of id
    let index = 0;

    function showNextImage() {
        images.forEach((img, i) => {
            img.style.opacity = i === index ? "1" : "0"; // Show one image at a time
        });
        index = (index + 1) % images.length; // Move to the next image
    }

    // Initialize styles for images
    images.forEach((img, i) => {
        img.style.position = "absolute";
        img.style.opacity = i === 0 ? "1" : "0";
        img.style.transition = "opacity 1s ease-in-out"; // Smooth transition
    });

    // Change image every 3 seconds
    setInterval(showNextImage, 2000);
});
