'use strict';
// Original builds inspired by everyday pretend play; linked pages are theme
// references, not instructions for these particular brick arrangements.
const PLAY_MODELS=(()=>{
 const models=[],animals='https://education.lego.com/en-us/products/creative-lego-duplo-brick-set-by-lego-education/45019/',treats='https://www.lego.com/en-us/product/ice-cream-truck-10586',dinosaurs='https://www.lego.com/en-us/product/3in1-dinosaurs-on-wheels-10451';
 function make(id,name,category,subtitle,ideas,reference=animals){
  const m={id:'play-'+id,name,level:'big',category,collection:'play',subtitle,concept:'locking',reference,adaptation:'本站原创造型与逐块教程，参考链接仅提供主题灵感，不是原版套装说明。',steps:[],ideas};models.push(m);
  return (title,x,z,y,w=1,d=1,c='yellow',kind)=>m.steps.push({title,text:`${title}。从作品左前方开始对照图案，向右 ${x*2} 个凸点、向后 ${z*2} 个凸点，高度为 ${y} 块砖；凸点朝上，对齐后轻轻按紧。`,pieces:[{x,z,y,w,d,c,...(kind?{kind}:{})}]});
 }
 const floor=(add,c='green',depth=2)=>{for(let z=0;z<depth;z++)for(let x=0;x<4;x+=2)add('铺好底座',x,z,0,2,1,c);};
 let a=make('puppy','摇尾巴小狗','animals','四只脚、长身体和翘尾巴',['给小狗取名字，带它去散步。','搭一只饭碗，安排小狗吃饭。','扶着身体，观察跨过接缝的背部砖。']);
 for(const x of [0,3])for(const z of [0,1])a('摆好四只小脚',x,z,0,1,1,'brown');
 for(const z of [0,1])for(const x of [0,2])a('连接小狗身体',x,z,1,2,1,'cream');
 a('跨接身体两半',1,.5,2,2,1,'brown');a('搭起脑袋',3,0,2,1,2,'brown');a('装上眼睛',3,0,3,1,1,'cream','eye');a('搭一只小耳朵',3,1,3,1,1,'brown');a('尾巴向上翘',0,.5,2,1,1,'brown');a('加高尾巴尖',0,.5,3,1,1,'cream');
 a=make('bunny','长耳小兔','animals','成对的长耳朵和软软的小肚子',['试着让两只耳朵用不同颜色。','搭一根胡萝卜，讲小兔找午饭的故事。','找找左右对称的脚、眼睛和耳朵。']);
 for(const x of [0,2])a('摆好长长的兔脚',x,0,0,1,2,'cream');
 for(const y of [1,2,3])for(const z of [0,1])a(y===3?'搭好圆脑袋':'连接兔子肚子',.5,z,y,2,1,'cream');
 for(const x of [.5,1.5])a('安上小眼睛',x,0,4,1,1,'cream','eye');for(const x of [0,2]){a('搭起耳朵根',x,1,4,1,1,'cream');a('让耳朵长高',x,1,5,1,1,'orange');}
 a=make('bear','抱抱小熊','animals','宽宽肚子与两只小耳朵',['为小熊搭一张床。','换成白色积木，讲北极熊的故事。','给小熊加一条围巾，看看颜色怎样变化。']);
 for(const x of [0,2])a('摆好小熊双脚',x,0,0,1,2,'brown');
 for(const y of [1,2])for(const z of [0,1])a('搭好抱抱肚子',.5,z,y,2,1,y===2?'cream':'brown');
 a('搭小熊脑袋',.5,.5,3,2,1,'brown');for(const x of [.5,1.5])a('加上眼睛',x,.5,4,1,1,'brown','eye');for(const x of [0,2])a('扣上圆耳朵',x,.5,5,1,1,'brown');
 a=make('stegosaur','背脊小剑龙','animals','四足、尾巴与彩色背板',['给背板排一个颜色规律。','搭几棵小树，让剑龙去吃叶子。','和长颈恐龙比一比谁的身体更长。'],dinosaurs);
 for(const x of [0,3])for(const z of [0,1])a('摆出剑龙四脚',x,z,0,1,1,'green');
 for(const z of [0,1])for(const x of [0,2])a('连接长长的身体',x,z,1,2,1,'green');
 a('连牢背脊',1,.5,2,2,1,'green');a('搭好小脑袋',3,0,2,1,2,'green');a('眼睛看前方',3,0,3,1,1,'yellow','eye');a('装上第一片背板',1,.5,3,1,1,'orange');a('装上第二片背板',2,.5,3,1,1,'yellow');a('伸出短尾巴',-.5,0,2,1,1,'green');
 a=make('icecream','三球冰淇淋','plants','巧克力甜筒和彩色冰淇淋球',['给三种颜色分别起口味名字。','搭一个小摊，轮流扮演店员和顾客。','改变球的颜色，按顾客点单重新搭。'],treats);
 for(let y=0;y<5;y++)a(['摆好甜筒底','搭厚甜筒','加香草冰淇淋','加草莓冰淇淋','加蓝莓冰淇淋'][y],0,0,y,2,1,['brown','brown','cream','red','blue'][y]);a('顶上加一颗小樱桃',.5,0,5,1,1,'red');
 a=make('birthday','生日蛋糕','scenes','双层蛋糕与三根彩色蜡烛',['给喜欢的人唱生日歌。','按年龄改变蜡烛数量，不使用真火。','用不同颜色讲讲蛋糕是什么味道。'],treats);floor(a,'blue');
 for(let x=0;x<4;x++)a('铺好第一层蛋糕',x,0,1,1,2,'cream');for(const z of [0,1])a('搭上第二层蛋糕',1,z,2,2,1,'red');for(const x of [1,2])a('装上奶油顶',x,0,3,1,2,'cream');for(const [x,z,c] of [[1,0,'yellow'],[2,0,'green'],[1.5,1,'orange']])a('装上一根彩色蜡烛',x,z,4,1,1,c);
 a=make('lollipop','彩虹棒棒糖','plants','长长糖棒与一颗大糖球',['把糖球换成你喜欢的颜色。','搭一家糖果店，让玩偶来买糖。','找一找大糖球怎样扣在细糖棒上。'],treats);
 a('放好展示底座',0,0,0,2,1,'green');for(const y of [1,2])a('搭高糖棒',.5,0,y,1,1,'cream');a('托住糖球底部',0,0,3,2,1,'orange');a('糖球左侧展开',-.5,0,4,2,1,'red');a('糖球右侧展开',1.5,0,4,1,1,'yellow');a('连接糖球两半',0,0,5,2,1,'blue');a('扣好糖球顶',.5,0,6,1,1,'green');
 a=make('helicopter','救援直升机','vehicles','长尾巴、驾驶舱与静态旋翼',['给直升机搭一块停机坪。','讲一个把小熊送到医院的故事。','旋翼是固定展示造型，请勿强拧；用手带整架飞机飞。']);
 a('铺好左侧机底',0,0,0,2,1,'blue');a('铺好右侧机底',2,0,0,2,1,'blue');a('搭好驾驶舱底',.5,0,1,2,1,'yellow');a('伸出长机尾',2.5,0,1,2,1,'yellow');a('装好驾驶舱',.5,0,2,2,1,'blue','eye');a('装上尾翼',3.5,0,2,1,1,'red');a('安装旋翼支柱',1,0,3,2,1,'cream');a('搭好左旋翼',0,0,4,2,1,'green');a('搭好右旋翼',2,0,4,2,1,'green');a('跨接固定旋翼',1,0,5,2,1,'cream');
 a=make('truck','水果小货车','vehicles','有轮底盘与装货车厢',['用不同颜色的方砖当水果。','给小摊送货，数数一趟装几箱。','先检查轮轴能否自由转动，再轻轻推车。']);
 a('准备带轮底盘',0,0,0,3,1,'blue','wheelbase');a('搭驾驶室底部',0,0,1,1,1,'yellow');a('铺好载货平台',1,0,1,2,1,'green');a('装上驾驶室眼睛',0,0,2,1,1,'yellow','eye');a('放上一箱水果',1.5,0,2,1,1,'orange');a('装上驾驶室车顶',0,0,3,1,1,'cream');a('再加一箱水果',1.5,0,3,1,1,'red');
 a=make('snack-stall','冰淇淋小摊','buildings','柜台、遮阳棚与两种口味',['轮流点单、搭冰淇淋、说谢谢。','把水果小货车停在摊位旁送货。','改变招牌颜色，讲讲你的小店卖什么。'],treats);floor(a,'green');
 for(let x=0;x<4;x++)a('搭好前后连接的柜台',x,0,1,1,2,'yellow');for(const y of [2,3])for(const x of [0,3])a('搭起遮阳棚立柱',x,1,y,1,1,'blue');for(const x of [0,2])a('装好半边遮阳棚',x,1,4,2,1,'red');a('跨接棚顶接缝',1,1,5,2,1,'cream');for(const [x,c] of [[1,'red'],[2,'yellow']]){a('摆好甜筒',x,0,2,1,1,'brown');a('装上一球冰淇淋',x,0,3,1,1,c);}
 a=make('treasure','寻宝小宝箱','scenes','敞口箱子与彩色宝石',['把彩色方砖当宝石，轮流藏和找。','给宝石分类，再数数每种颜色。','箱子没有铰链和活动盖子，可以自己添一个可拆的平盖。']);floor(a,'brown',3);
 for(const z of [0,2])for(const x of [0,2])a('围好前后箱壁',x,z,1,2,1,'brown');for(const x of [0,3])a('围好侧边箱壁',x,1,1,1,1,'brown');for(const x of [0,3])a('连接箱子的前后壁',x,.5,2,1,2,'yellow');for(const z of [0,2])a('连接箱壁左右两半',1,z,2,2,1,'brown');a('放入第一颗宝石',1,1,1,1,1,'blue');a('放入第二颗宝石',2,1,1,1,1,'red');
 a=make('picnic-bench','公园野餐长椅','scenes','椅脚、长座板与靠背',['给小熊和小兔安排座位。','旁边搭一棵树，讲一次野餐。','找找靠背中间跨接的积木怎样连住左右。']);floor(a,'green');
 for(const x of [0,3])a('搭好长椅双脚',x,0,1,1,2,'brown');for(const z of [0,1])for(const x of [0,2])a('装好长长座板',x,z,2,2,1,'yellow');for(const x of [0,2])a('搭好靠背',x,1,3,2,1,'brown');a('连接左右靠背',1,1,4,2,1,'yellow');
 return models;
})();
