const express = require('express');
const { isAuth } = require('../middlewares/auth');
const { getCommunity, getMyLike, createComment, editComment, deleteComment, setLike } = require('../controllers/updateInteractions');

const router = express.Router();
function validateId(req, res, next, id) {
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
        return res.status(400).json({ message: 'El identificador no es válido.' });
    }
    next();
}
router.param('id', validateId);
router.param('commentId', validateId);

router.get('/:id/community', getCommunity);
router.get('/:id/like', isAuth, getMyLike);
router.put('/:id/like', isAuth, setLike);
router.delete('/:id/like', isAuth, setLike);
router.post('/:id/comments', isAuth, createComment);
router.patch('/:id/comments/:commentId', isAuth, editComment);
router.delete('/:id/comments/:commentId', isAuth, deleteComment);

module.exports = router;
