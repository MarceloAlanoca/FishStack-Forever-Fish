const sayHello = (req, res) => {
    res.json({ message: "Bienvenido a la API de FishStack" });
};

module.exports = { sayHello };
