import multer from "multer";
const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,"./public/temp") //multr is asking for where to save file
    },
    filename:function(req,file,cb){
        cb(null,file.originalname)//multer is asking what to name file
    }
})

 export const upload = multer({storage,})