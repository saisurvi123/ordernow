const jwt=require('jsonwebtoken')
const jwt_secret="shskdfjaoeruwo";
const fetchbuyer=(req,res,next)=>{
    const token=req.header('auth-token');
    if(!token){
        res.status(401).send({error:"pls authenticate using valid token"})
    }
    else{
        try {
            const data=jwt.verify(token,jwt_secret);
            // console.log(data)
            req.user=data;
            next();
            
        } catch (error) {
            res.status(401).send({error:"pls authenticate using valid token"})
        }
    }
}

module.exports=fetchbuyer;