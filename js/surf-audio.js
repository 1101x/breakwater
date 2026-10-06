// Stereo surf synthesized locally with filtered noise; no microphone or network audio.
export class SurfAudio {
  constructor(){this.context=null;this.muted=false;this.ready=false;this.level=null;}
  async start(){
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext)return false;
    if(!this.context){
      const c=this.context=new AudioContext();
      const buffer=c.createBuffer(2,c.sampleRate*13,c.sampleRate);
      for(let channel=0;channel<2;channel++){
        const samples=buffer.getChannelData(channel);let low=0;
        for(let i=0;i<samples.length;i++){const white=Math.random()*2-1;low=(low+.025*white)/1.025;samples[i]=low*3+white*.18;}
        // Smooth the loop seam.
        for(let i=0;i<2000;i++){const a=i/2000;samples[i]=samples[samples.length-2000+i]*(1-a)+samples[i]*a;}
      }
      const source=c.createBufferSource();source.buffer=buffer;source.loop=true;
      const high=c.createBiquadFilter();high.type='highpass';high.frequency.value=90;
      const filter=this.filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1700;filter.Q.value=.4;
      const level=this.level=c.createGain();level.gain.value=0;
      const master=this.master=c.createGain();master.gain.value=this.muted?0:.75;
      source.connect(high).connect(filter).connect(level).connect(master).connect(c.destination);source.start();
    }
    await this.context.resume();this.ready=this.context.state==='running';return this.ready;
  }
  update(time,waveFront){
    if(!this.ready||this.context.state!=='running')return;
    const surge=Math.pow(.5+.5*Math.sin(time*.67-1.3),2);
    const impact=Math.exp(-Math.pow((waveFront-3)/10,2));
    this.level.gain.setTargetAtTime(.10+surge*.25+impact*.65,this.context.currentTime,.12);
    this.filter.frequency.setTargetAtTime(950+surge*1350+impact*2500,this.context.currentTime,.2);
  }
  async toggle(){this.muted=!this.muted;await this.start();this.master?.gain.setTargetAtTime(this.muted?0:.75,this.context.currentTime,.08);}
  async visibility(hidden){if(!this.context)return;if(hidden)await this.context.suspend();else if(this.ready)await this.context.resume();}
}
