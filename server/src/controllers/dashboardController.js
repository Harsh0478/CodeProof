import Translation from '../models/Translation.js';
export async function stats(req,res){const [total,verified,failed,avg,recent]=await Promise.all([
Translation.countDocuments({userId:req.user._id}),Translation.countDocuments({userId:req.user._id,status:'VERIFIED'}),Translation.countDocuments({userId:req.user._id,status:{$in:['FAILED','COMPILATION ERROR','RUNTIME ERROR']}}),Translation.aggregate([{$match:{userId:req.user._id,verificationScore:{$ne:null}}},{$group:{_id:null,avg:{$avg:'$verificationScore'}}}]),Translation.find({userId:req.user._id}).sort({createdAt:-1}).limit(6).lean()]);
res.json({success:true,stats:{total,verified,failed,averageScore:Math.round(avg[0]?.avg||0),recent}});}
