export type Portal = 'owner' | 'designer' | 'visitor';
export const portalText:Record<Portal,string>={owner:'屋主',designer:'設計師',visitor:'參觀'};
export type Status = 'pending' | 'ready' | 'passed';
export type ProgressUpdate = { note:string; createdAt:string };
export type Round = { number:number; createdAt:string; description:string; photos:string[]; updates?:ProgressUpdate[]; reportNote?:string; repairPhotos?:string[]; reportedAt?:string; verdict?:'pass'|'fail'; verdictNote?:string; inspectedAt?:string };
export type Issue = { id:number; requestId:string; room:string; location:string; description:string; planId:string|null; x:number|null; y:number|null; status:Status; rounds:Round[]; revision:number; createdAt:string; updatedAt:string };
export type Plan = { id:string; name:string; createdAt:string };
export type State = { plans:Plan[]; issues:Issue[] };
export const statusText:Record<Status,string>={pending:'待修復',ready:'待驗收',passed:'已通過'};
export const code=(id:number)=>`A${String(id).padStart(3,'0')}`;
export const rooms=['客廳','餐廳','廚房','主臥','次臥','浴室','陽台','玄關','儲藏室','工作區'];
// Synthetic fixture only. No real home, person, photo, or inspection record.
export const demoState:State={
  "plans": [
    {
      "id": "demo-plan",
      "name": "虛構示意圖（非實際住宅）",
      "createdAt": "2030-01-01T00:00:00Z"
    }
  ],
  "issues": [
    {
      "id": 1,
      "requestId": "fictional-demo-1",
      "room": "客廳",
      "location": "示意區 A 的牆面",
      "description": "虛構範例：塗層有色差，請重新確認。",
      "planId": "demo-plan",
      "x": 0.28,
      "y": 0.4,
      "status": "pending",
      "rounds": [
        {
          "number": 1,
          "createdAt": "2030-01-01T01:00:00Z",
          "description": "虛構範例：塗層有色差，請重新確認。",
          "photos": [],
          "updates": [
            {
              "note": "虛構範例：已安排處理，預計下週完成。",
              "createdAt": "2030-01-02T01:00:00Z"
            }
          ]
        }
      ],
      "revision": 0,
      "createdAt": "2030-01-01T01:00:00Z",
      "updatedAt": "2030-01-04T01:00:00Z"
    },
    {
      "id": 2,
      "requestId": "fictional-demo-2",
      "room": "次臥",
      "location": "示意區 B 的櫃門",
      "description": "虛構範例：櫃門開啟不順，請調整。",
      "planId": "demo-plan",
      "x": 0.73,
      "y": 0.3,
      "status": "ready",
      "rounds": [
        {
          "number": 1,
          "createdAt": "2030-01-01T01:00:00Z",
          "description": "虛構範例：櫃門開啟不順，請調整。",
          "photos": [],
          "updates": [
            {
              "note": "虛構範例：已安排處理，預計下週完成。",
              "createdAt": "2030-01-02T01:00:00Z"
            }
          ],
          "reportNote": "虛構範例：已完成調整。",
          "repairPhotos": [],
          "reportedAt": "2030-01-03T01:00:00Z"
        }
      ],
      "revision": 0,
      "createdAt": "2030-01-01T01:00:00Z",
      "updatedAt": "2030-01-04T01:00:00Z"
    },
    {
      "id": 3,
      "requestId": "fictional-demo-3",
      "room": "浴室",
      "location": "示意區 C 的接縫",
      "description": "虛構範例：接縫需要補膠。",
      "planId": "demo-plan",
      "x": 0.73,
      "y": 0.68,
      "status": "passed",
      "rounds": [
        {
          "number": 1,
          "createdAt": "2030-01-01T01:00:00Z",
          "description": "虛構範例：接縫需要補膠。",
          "photos": [],
          "updates": [
            {
              "note": "虛構範例：已安排處理，預計下週完成。",
              "createdAt": "2030-01-02T01:00:00Z"
            }
          ],
          "reportNote": "虛構範例：已完成調整。",
          "repairPhotos": [],
          "reportedAt": "2030-01-03T01:00:00Z",
          "verdict": "pass",
          "verdictNote": "OK（虛構驗收）",
          "inspectedAt": "2030-01-04T01:00:00Z"
        }
      ],
      "revision": 0,
      "createdAt": "2030-01-01T01:00:00Z",
      "updatedAt": "2030-01-04T01:00:00Z"
    }
  ]
};
