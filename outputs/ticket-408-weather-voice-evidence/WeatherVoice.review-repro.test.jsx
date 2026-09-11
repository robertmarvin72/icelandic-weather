import React from 'react';
import {it,expect,vi} from 'vitest';
import {render} from '@testing-library/react';
import WeatherVoiceCard from './WeatherVoiceCard';
it('review: disconnected observer must not notify for replaced content',()=>{
 const callbacks=[];
 vi.stubGlobal('IntersectionObserver',class{constructor(cb){callbacks.push(cb)} observe(){} disconnect(){}});
 Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});
 const onVisible=vi.fn();
 const result=id=>({show:true,condition:'good',mood:'happy',severity:0,comment:{id,text:id},ctaType:null});
 const r=render(<WeatherVoiceCard result={result('good_01')} onVisible={onVisible}/>);
 const old=callbacks[0];
 r.rerender(<WeatherVoiceCard result={result('good_02')} onVisible={onVisible}/>);
 old([{isIntersecting:true,intersectionRatio:1}]);
 expect(onVisible).not.toHaveBeenCalled();
 r.unmount();vi.unstubAllGlobals();
});
