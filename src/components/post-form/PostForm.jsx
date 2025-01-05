import React, { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import {Button , Input , Select , RTE} from '../index'
import appwriteService from "../../appwrite/config"
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ClipLoader } from 'react-spinners'

export default function PostForm({post}) {
    const [loading , setLoading] = useState(false);
    const {register , handleSubmit ,watch, setValue, control , getValues} = useForm({
        defaultValues : {
            title : post?.title || '',
            slug : post?.$id || '',
            content : post?.content || '',
            status : post?.status || 'active',
        },
    });

    const navigate = useNavigate();
    const userData = useSelector((state) => state.auth.userData)

    const submit = async (data) => {
        setLoading(true);
        if(post){
            const file = data.image[0] ? await appwriteService.uploadFile(data.image[0]) : null;

            if(file){
                appwriteService.deleteFile(post.featuredImage)
            }
            const dbPost = await appwriteService.updatePost(post.$id, {
                ...data,
                featuredImage : file ? file.$id : undefined          
            })
            if(dbPost){
                navigate(`/post/${dbPost.$id}`)
            }
        }else{
            // TODO : improve the logic , see if block in above
            const file = await appwriteService.uploadFile(data.image[0])

            if(file){
             const fileId = file.$id
             data.featuredImage = fileId;
             const dbPost = await appwriteService.createPost({
                ...data,
                userId : userData.$id
             });

             if(dbPost){
                setLoading(false);
                navigate(`/post/${dbPost.$id}`, {replace: true});
             }
            }
        }
    };

    const slugTransform = useCallback((value) => {
        if(value && typeof value === "string"){
            return value
                .trim()
                .toLowerCase()
                .replace(/[^a-zA-Z\d\s]+/g,"-")
                .replace(/\s/g, "-")                
        }
        return "";
    },[]);

    React.useEffect(() => {
        const subscription = watch((value , {name}) => {
            if(name === 'title'){
                setValue('slug',slugTransform(value.title),
                    {shouldValidate : true});
            }
        })

        return () => subscription.unsubscribe();
    },[watch,slugTransform , setValue]);

  return (
    <>
    <h1 className='text-2xl text-black'>Add Your Post here</h1>
       <form onSubmit={handleSubmit(submit)} className="flex flex-wrap">
            <div className="w-2/3 px-2">
                <Input
                    label="Title :"
                    placeholder="Title"
                    className="mb-4 p-2"
                    {...register("title", { required: true })}
                />
                <Input
                    label="Slug :"
                    placeholder="Slug"
                    className="mb-4 p-2"
                    {...register("slug", { required: true })}
                    onInput={(e) => {
                        setValue("slug", slugTransform(e.currentTarget.value), { shouldValidate: true });
                    }}
                />
                <RTE label="Content :" name="content" control={control} defaultValue={getValues("content")} />
            </div>
            <div className="w-1/3 px-2">
                <Input
                    label="Featured Image :"
                    type="file"
                    className="mb-4 p-2"
                    accept="image/png, image/jpg, image/jpeg, image/gif"
                    {...register("image", { required: !post })}
                />
                {post && (
                    <div className="w-full mb-2">
                        <img
                            src={appwriteService.getFilePreview(post.featuredImage)}
                            alt={post.title}
                            className="rounded-lg"
                        />
                    </div>
                )}

                <div>

                <h3>Status : </h3>
                <Select               
                    options={["active", "inactive"]}
                    label="Status"
                    className="mb-4 p-2"
                    {...register("status", { required: true })}
                />
                </div>
               
                <Button type="submit"  bgColor={post ? "bg-green-500" : undefined} className="w-full mt-8">
                    {loading ? (
                        <ClipLoader color="#fff" size={18} />
                    ) : post ? "Update" : "Post"}
                </Button>
            </div>
        </form>

        </>

  )
}


