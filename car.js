const fordCars = [
    {
        model: "Ford Model T",
        year: "1908-1927",
        fuelType: "Petrol",
        engine: "2.9L I4",
        topSpeed: "72 km/h",
        mileage: "18 km/l",
        description: "The first mass-produced car that revolutionized the automobile industry.",
        image: "ford-model-t.png"
    },
    {
        model: "Ford Model A",
        year: "1927-1931",
        fuelType: "Petrol",
        engine: "3.3L L-Head I4",
        topSpeed: "104 km/h",
        mileage: "15 km/l",
        description: "Successor to the Model T, featuring better performance and styling.",
        image: "ford-model-a.png"
    },
    {
        model: "Ford Mustang",
        year: "1964-Present",
        fuelType: "Petrol",
        engine: "5.0L V8",
        topSpeed: "250 km/h",
        mileage: "9 km/l",
        description: "An iconic pony car known for its performance and style.",
        image: "ford-mustang.png"
    },
    {
        model: "Ford GT40",
        year: "1964-1969",
        fuelType: "Petrol",
        engine: "7.0L V8",
        topSpeed: "330 km/h",
        mileage: "7 km/l",
        description: "Defeated Ferrari at Le Mans, becoming a racing legend.",
        image: "ford-gt40.png"
    },

    {
        model: "Ford Model T",
        year: "1908-1927",
        fuelType: "Petrol",
        engine: "2.9L I4",
        topSpeed: "72 km/h",
        mileage: "18 km/l",
        description: "The first mass-produced car that revolutionized the automobile industry."
    },
    {
        model: "Ford Model A",
        year: "1927-1931",
        fuelType: "Petrol",
        engine: "3.3L L-Head I4",
        topSpeed: "104 km/h",
        mileage: "15 km/l",
        description: "Successor to the Model T, featuring better performance and styling."
    },
    {
        model: "Ford V8",
        year: "1932",
        fuelType: "Petrol",
        engine: "3.6L Flathead V8",
        topSpeed: "130 km/h",
        mileage: "12 km/l",
        description: "Introduced the flathead V8 engine, setting new performance standards."
    },
    {
        model: "Ford Thunderbird",
        year: "1955-2005",
        fuelType: "Petrol",
        engine: "4.8L V8",
        topSpeed: "190 km/h",
        mileage: "10 km/l",
        description: "A luxury sports car that competed with the Chevrolet Corvette."
    },
    {
        model: "Ford Mustang",
        year: "1964-Present",
        fuelType: "Petrol",
        engine: "5.0L V8",
        topSpeed: "250 km/h",
        mileage: "9 km/l",
        description: "An iconic pony car known for its performance and style."
    },
    {
        model: "Ford GT40",
        year: "1964-1969",
        fuelType: "Petrol",
        engine: "7.0L V8",
        topSpeed: "330 km/h",
        mileage: "7 km/l",
        description: "Defeated Ferrari at Le Mans, becoming a racing legend."
    },
    {
        model: "Ford F-100",
        year: "1953-1983",
        fuelType: "Diesel/Petrol",
        engine: "4.9L I6",
        topSpeed: "140 km/h",
        mileage: "10 km/l",
        description: "Part of the legendary F-Series trucks, widely popular in the U.S."
    },
    {
        model: "Ford Pinto",
        year: "1971-1980",
        fuelType: "Petrol",
        engine: "2.3L I4",
        topSpeed: "160 km/h",
        mileage: "14 km/l",
        description: "A subcompact car known for its affordability and fuel efficiency."
    },
    {
        model: "Ford Falcon",
        year: "1960-1970",
        fuelType: "Petrol",
        engine: "3.3L I6",
        topSpeed: "180 km/h",
        mileage: "12 km/l",
        description: "A compact car that paved the way for the Mustang."
    },
    {
        model: "Ford Bronco",
        year: "1966-Present",
        fuelType: "Petrol/Diesel",
        engine: "2.7L V6 / 5.0L V8",
        topSpeed: "190 km/h",
        mileage: "11 km/l",
        description: "An off-road SUV with a cult following."
    }
];

// Function to display car details in console (optional)
function showCarDetails(modelName) {
    const car = fordCars.find(car => car.model.toLowerCase() === modelName.toLowerCase());
    if (car) {
        console.log(`🚗 Model: ${car.model}`);
        console.log(`📅 Year: ${car.year}`);
        console.log(`⛽ Fuel Type: ${car.fuelType}`);
        console.log(`🔧 Engine: ${car.engine}`);
        console.log(`🏎️ Top Speed: ${car.topSpeed}`);
        console.log(`⛽ Mileage: ${car.mileage}`);
        console.log(`ℹ️ Description: ${car.description}`);
    } else {
        console.log("Car model not found.");
    }
}

// Example usage
showCarDetails("Ford Mustang");
