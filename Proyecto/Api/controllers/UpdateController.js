const { Op } = require("sequelize");
const User = require("../models/UpdateModel");
const { update } = require("../models/UpdateModel");
const { updatecomentarios } = require("../models/UpdateComentariosModel");
const { comentarios } = requite("../models/UpdateComentariosModel.js")

const getUpdates = async (req, res) => {
    try{
        const updates = await Updates.findAll();
        let Updates = [];
        for (let i = 0; i < updates.length; i++) {
            Updates.push(updates[i])
        }
        res.status(200).json(updates)
    }
    catch{
        res.status(500).json(error)
    }
}

const getUpdatesByID = async (req, res) => {
    try{
        const { id } = req.params
        const updates = await Updates.findByPk();
        if (!updates) {
        return res.status(404).json({ message: "Update no existente we" });
        }
        res.status(200).json(updates)
    }
    catch{
        res.status(500).json(error)
    }
}

const getComments = async (req, res) => {
    try{
        const comments = await updatescomentarios.findAll();
        let Comments = [];
        for (let i = 0; i < updatescomentarios.length; i++) {
            Updates.push(updates[i])
        }
        res.status(200).json(updates)
    }
    catch{
        res.status(500).json(error)
    }
}

// const get = async (req, res) => {
//     try{

//     }
//     catch{

//     }
// }