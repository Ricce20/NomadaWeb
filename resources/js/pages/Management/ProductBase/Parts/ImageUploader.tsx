import React, { useState } from "react";
import { router } from "@inertiajs/react";
import management from '@/routes/management';
import ImagePreview from '@/components/ImagePreview';
import ConfirmModal from '@/components/ConfirmModal';

type Img = { id:number; path:string; is_primary:boolean; sort_order:number };

export default function ImageUploader({ productId, images = [] as Img[] }:{
  productId:number; images:Img[];
}){
  const [files,setFiles]=useState<FileList|null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; imgId: number | null }>({
    isOpen: false,
    imgId: null,
  });

  const onSubmit=(e:React.FormEvent)=>{ e.preventDefault();
    if(!files || files.length===0) return;
    const fd=new FormData();
    Array.from(files).forEach(f=>fd.append("images[]",f));
    router.post(management.productBases.images.store.url(productId), fd, {
      forceFormData:true, onFinish:()=>setFiles(null)
    });
  };

  const onDelete=()=>{
    if (!deleteModal.imgId) return;
    router.delete(management.productBases.images.destroy.url({product:productId, image:deleteModal.imgId}));
  };

  const handleRemovePreview = (index: number) => {
    if (!files) return;
    const dt = new DataTransfer();
    Array.from(files).forEach((file, i) => {
      if (i !== index) dt.items.add(file);
    });
    setFiles(dt.files.length > 0 ? dt.files : null);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            onChange={e=>setFiles(e.target.files)}
            className="text-sm"
          />
          <button 
            type="submit" 
            disabled={!files || files.length === 0}
            className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Subir
          </button>
        </div>
        <ImagePreview files={files} onRemove={handleRemovePreview} />
      </form>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {images.map(img=>(
          <div key={img.id} className="border rounded p-2 flex flex-col gap-2 dark:border-neutral-700">
            <img src={`/storage/${img.path}`} alt="" className="w-full h-32 object-cover rounded" />
            <div className="text-xs flex items-center justify-between">
              <span className={img.is_primary ? "text-green-600 font-medium" : "text-neutral-500"}>
                {img.is_primary ? "Principal" : "—"}
              </span>
              <button 
                type="button" 
                onClick={()=>setDeleteModal({ isOpen: true, imgId: img.id })} 
                className="text-red-600 hover:underline dark:text-red-400"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {images.length===0 && <div className="text-sm text-neutral-500">Sin imágenes.</div>}
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, imgId: null })}
        onConfirm={onDelete}
        title="Eliminar imagen"
        message="¿Estás seguro de eliminar esta imagen? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
}