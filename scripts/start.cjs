const { spawn } = require('node:child_process');
const path = require('node:path');
const args=process.argv.slice(2);
const env={...process.env, HOSTNAME:'127.0.0.1'};
for(let index=0;index<args.length;index+=2){
  if(args[index]==='--hostname')env.HOSTNAME=args[index+1];
  else if(args[index]==='--port')env.PORT=args[index+1];
  else throw new Error(`Unknown argument: ${args[index]}`);
}
env.HOSTNAME=env.HOSTNAME||'127.0.0.1';
const child=spawn(process.execPath,[path.resolve(__dirname,'../.next/standalone/server.js')],{env,stdio:'inherit'});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>{process.exitCode=code??1;});
