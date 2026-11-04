const { Mission } = require("../models/missionModel");

const question = (text, options, correct, explanation) => ({ text, options, correct, explanation });
const missions = [
    { title: "Guardianes del arrecife", description: "Antes de zarpar, demuestra que sabes cuidar el hogar de nuestras capturas.", reward: 150, active: true,
        questions: [
            question("¿Qué hacer con un sedal que ya no utilizas?", ["Dejarlo en el mar", "Llevarlo a un punto de recogida adecuado", "Enterrarlo en la arena"], 1, "El sedal abandonado puede enredar a la fauna. Retíralo y deposítalo en un punto de recogida adecuado."),
            question("¿Qué son los corales?", ["Animales", "Piedras", "Plantas terrestres"], 0, "Los corales son animales; sus colonias forman ecosistemas que albergan muchas especies."),
            question("¿Cuál de estas prácticas protege el arrecife?", ["Llevarse coral de recuerdo", "Anclar sobre el coral", "Observar sin tocar ni extraer"], 2, "Observar sin tocar evita dañar organismos frágiles del arrecife.")
        ] },
    { title: "Escuela de navegantes", description: "La tripulación necesita un navegante atento. Resuelve el desafío del puerto.", reward: 150, active: true,
        questions: [
            question("¿Cómo se llama el lado derecho de una embarcación mirando hacia proa?", ["Babor", "Estribor", "Popa"], 1, "Estribor es el costado derecho mirando hacia proa; babor es el izquierdo."),
            question("¿Qué instrumento indica los puntos cardinales?", ["Termómetro", "Ancla", "Brújula"], 2, "La brújula permite orientar la navegación mediante los puntos cardinales."),
            question("¿Qué parte de la embarcación es la proa?", ["La parte delantera", "La parte trasera", "El fondo del mar"], 0, "La proa es la parte delantera de la embarcación; la popa es la trasera.")
        ] },
    { title: "Secretos del océano", description: "Descubre cuánto conoces del mundo que inspira FishStack.", reward: 150, active: true,
        questions: [
            question("¿Qué animal marino es un mamífero?", ["Sardina", "Pulpo", "Delfín"], 2, "Los delfines son mamíferos: respiran aire mediante pulmones."),
            question("¿Qué usan la mayoría de los peces para respirar bajo el agua?", ["Branquias", "Alas", "Antenas"], 0, "Las branquias permiten extraer oxígeno disuelto en el agua."),
            question("¿Qué significa bioluminiscencia?", ["Cambiar de tamaño", "Producir luz mediante procesos biológicos", "Vivir únicamente en ríos"], 1, "La bioluminiscencia es la producción de luz por organismos vivos mediante reacciones químicas.")
        ] }
];

async function seedMissions() {
    if (await Mission.count() === 0) await Mission.bulkCreate(missions);
}

module.exports = { seedMissions };
