// Looped surf recording ("Sea: Waves", BigSoundBank, CC0), swelling when the big wave hits.
export class SurfAudio {
  constructor(){this.context=null;this.muted=false;this.ready=false;this.level=null;}
  async start(){
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext)return false;
    if(!this.context){
      const c=this.context=new AudioContext();
      const filter=this.filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=4000;filter.Q.value=.3;
      const level=this.level=c.createGain();level.gain.value=0;
      const master=this.master=c.createGain();master.gain.value=this.muted?0:.75;
      filter.connect(level).connect(master).connect(c.destination);
      this.loading=fetch('./src/waves.mp3').then(r=>r.arrayBuffer()).then(b=>new Promise((ok,fail)=>c.decodeAudioData(b,ok,fail))).then(buffer=>{
        const source=c.createBufferSource();source.buffer=buffer;source.loop=true;
        // Skip MP3 encoder padding at both ends so the loop seam doesn't click.
        source.loopStart=.05;source.loopEnd=buffer.duration-.05;
        source.connect(filter);source.start(0,.05);
      });
    }
    await this.context.resume();await this.loading;this.ready=this.context.state==='running';return this.ready;
  }
  update(time,waveFront){
    if(!this.ready||this.context.state!=='running')return;
    const impact=Math.exp(-Math.pow((waveFront-3)/10,2));
    this.level.gain.setTargetAtTime(.55+impact*.5,this.context.currentTime,.15);
    this.filter.frequency.setTargetAtTime(2600+impact*9000,this.context.currentTime,.2);
  }
  async toggle(){this.muted=!this.muted;await this.start();this.master?.gain.setTargetAtTime(this.muted?0:.75,this.context.currentTime,.08);}
  async visibility(hidden){if(!this.context)return;if(hidden)await this.context.suspend();else if(this.ready)await this.context.resume();}
}
