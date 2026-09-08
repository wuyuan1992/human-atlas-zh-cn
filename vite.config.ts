import fs from 'node:fs';
import {extname,join,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {defineConfig,type Plugin} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
const path=(relative:string)=>fileURLToPath(new URL(relative,import.meta.url));

/** Serves exercise media (GIFs/posters) from the exercises-dataset clone under /exercises/
    without copying 136 MB into public/. Production builds copy the folder into dist instead. */
function exerciseMedia():Plugin{
	const root=path('./exercises-dataset');
	const types:Record<string,string>={'.gif':'image/gif','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp'};
	return {
		name:'exercise-media',
		configureServer(server){
			server.middlewares.use('/exercises',(req,res,next)=>{
				const relative=decodeURIComponent((req.url??'').split('?')[0]).replace(/^\/+/,'');
				const file=resolve(root,relative);
				if(!file.startsWith(root+sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){next();return;}
				res.setHeader('Content-Type',types[extname(file).toLowerCase()]??'application/octet-stream');
				res.setHeader('Cache-Control','public, max-age=31536000, immutable');
				fs.createReadStream(file).pipe(res);
			});
		},
	};
}

export default defineConfig({root:path('./web'),publicDir:path('./public'),plugins:[react(),exerciseMedia()],resolve:{alias:{'@':path('./')}},css:{postcss:{plugins:[tailwindcss()]}},server:{watch:{usePolling:true}},build:{outDir:path('./dist'),emptyOutDir:true}});
