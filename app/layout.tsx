import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'家驗｜裝潢驗收',description:'在平面圖上找到問題，記錄每次修復與驗收。',robots:{index:false,follow:false},referrer:'no-referrer',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="zh-Hant"><body>{children}</body></html>}
