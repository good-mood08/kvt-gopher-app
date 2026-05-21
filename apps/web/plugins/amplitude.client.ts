import * as amplitude from '@amplitude/analytics-browser';

export default defineNuxtPlugin(() => {
  amplitude.init('1e625e85fac0cfc5b3000c3cbb078854', undefined, {
    autocapture: {
      pageViews: true, 
      sessions: true,  
      formInteractions: true, 
      elementInteractions: true 
    }
  });
});