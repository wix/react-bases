import * as React from 'react';
import {expect, sinon, ClientRenderer} from 'test-drive-react';
import {
    Class, registerBeforeMethod,
    registerForConstructor
} from "../../src/utils/mixer";
import _reduce = require('lodash/reduce');
import _forEach = require('lodash/forEach');
import {expectSpyChain} from '../test-drivers/spy-chain';

const MAGIC_NUM = 123;
const MAGIC_NUM2 = 456;
// this class is used for type checking
class _Base {
    constructor(public myNumber:number){}
    myMethod(foo:number):number{ return 3.14;}

}
function makeBaseClass(spy?:sinon.SinonSpy): typeof _Base {
    return class Base extends _Base{
        myMethod(foo:number):number{
            return spy && spy() || 3.14;
        }
    };
}

describe("mixer", () => {
    let Base: typeof _Base;

    describe("registerForConstructor", () => {
        let spy1: sinon.SinonSpy;
        let spy2: sinon.SinonSpy;

        function mixin1<T>(cls: Class<T>): Class<T> {
            return registerForConstructor(cls, spy1);
        }

        function mixin2<T>(cls: Class<T>): Class<T> {
            return registerForConstructor(cls, spy2);
        }

        beforeEach('init Base class', () => {
            Base = makeBaseClass();
            spy1 = sinon.spy();
            spy2 = sinon.spy();
        });

        it('called on instance creation (direct apply on class)', () => {
            const spy3 = sinon.spy();

            @mixin2
            @mixin1
            class UserClass extends Base {
                constructor(myNumber:number) {
                    expect(spy1).to.have.callCount(0);
                    expect(spy2).to.have.callCount(0);
                    super(myNumber);
                    spy3(this);
                }
            }

            let obj = new UserClass(MAGIC_NUM);
            expect(obj.myNumber).to.equal(MAGIC_NUM);
            expect(obj.constructor.name, 'obj.constructor.name').to.equal('UserClass');
            expect(spy1, 'spy1').to.have.callCount(1).and.calledWith(sinon.match.same(obj), [MAGIC_NUM]);
            expect(spy2, 'spy2').to.have.callCount(1).and.calledWith(sinon.match.same(obj), [MAGIC_NUM]);
            expect(spy3, 'spy3').to.have.callCount(1).and.calledWith(sinon.match.same(obj));

            expectSpyChain(
                {n: 'spy1', c: spy1.firstCall},
                {n: 'spy2', c: spy2.firstCall});

        });
        it('when applied on parent class, called on instance creation before user code constructor', () => {
            const spy3 = sinon.spy();

            class UserClass extends mixin2(mixin1(Base)) {
                constructor(myNumber:number) {
                    super(myNumber);
                    spy3(this);
                }
            }
            let obj = new UserClass(MAGIC_NUM);
            expect(obj.myNumber).to.equal(MAGIC_NUM);
            expect(obj.constructor.name, 'obj.constructor.name').to.equal('UserClass');
            expect(spy1, 'spy1').to.have.callCount(1).and.calledWith(sinon.match.same(obj), [MAGIC_NUM]);
            expect(spy2, 'spy2').to.have.callCount(1).and.calledWith(sinon.match.same(obj), [MAGIC_NUM]);
            expect(spy3, 'spy3').to.have.callCount(1).and.calledWith(sinon.match.same(obj));

            expectSpyChain(
                {n: 'spy1', c: spy1.firstCall},
                {n: 'spy2', c: spy2.firstCall},
                {n: 'spy3', c: spy3.firstCall});
        });
    });

    describe("registerForMethod", () => {
        const METHOD = 'myMethod';
        let spy1: sinon.SinonSpy; // mixin 1
        let spy2: sinon.SinonSpy; // mixin 2
        let spy3: sinon.SinonSpy; // original base class
        let spy4: sinon.SinonSpy; // user class


        function mixin1<T>(cls: Class<T>): Class<T> {
            return registerBeforeMethod(cls, METHOD, spy1);
        }

        function mixin2<T>(cls: Class<T>): Class<T> {
            return registerBeforeMethod(cls, METHOD, spy2);
        }

        beforeEach('init Base class', () => {
            spy1 = sinon.spy();
            spy2 = sinon.spy();
            spy3 = sinon.spy();
            spy4 = sinon.spy(()=> MAGIC_NUM2);
            Base = makeBaseClass(spy3);
        });

        it('called on instance method (direct apply on class)', () => {
            const spy3 = sinon.spy();

            @mixin2
            @mixin1
            class UserClass extends Base {
                myMethod(foo:number):number{
                    return spy4();
                }
            }

            let obj = new UserClass(0);
            let result = obj.myMethod(MAGIC_NUM);

            expect(result).to.equal(MAGIC_NUM2);
            expect(obj.constructor.name, 'obj.constructor.name').to.equal('UserClass');
            expect(spy1, 'spy1').to.have.callCount(1).and.calledWith(sinon.match.same(obj), [MAGIC_NUM]);
            expect(spy2, 'spy2').to.have.callCount(1).and.calledWith(sinon.match.same(obj), [MAGIC_NUM]);
            expect(spy3, 'spy3').to.have.callCount(1).and.calledWith(sinon.match.same(obj), [MAGIC_NUM]);
            expect(spy4, 'spy4').to.have.callCount(1).and.calledWith(sinon.match.same(obj), [MAGIC_NUM]);

            expectSpyChain(
                {n: 'spy1', c: spy1.firstCall},
                {n: 'spy2', c: spy2.firstCall},
                {n: 'spy1', c: spy1.firstCall},
                {n: 'spy2', c: spy2.firstCall});

        });
        it('when applied on parent class, called on instance creation before user code constructor', () => {
            const spy3 = sinon.spy();

            class UserClass extends mixin2(mixin1(Base)) {
                constructor() {
                    super();
                    spy3(this);
                }
            }
            let obj = new UserClass();
            expect(obj.constructor.name, 'obj.constructor.name').to.equal('UserClass');
            expect(spy3, 'spy3').to.have.callCount(1).and.calledWith(sinon.match.same(obj));
            expect(spy1, 'spy1').to.have.callCount(1).and.calledWith(sinon.match.same(obj));
            expect(spy2, 'spy2').to.have.callCount(1).and.calledWith(sinon.match.same(obj));

            expectSpyChain(
                {n: 'spy1', c: spy1.firstCall},
                {n: 'spy2', c: spy2.firstCall},
                {n: 'spy3', c: spy3.firstCall});
        });
    });
});

/*


 //'mixin1SpyBefore','mixin2SpyBefore','mixin1SpyAfter','mixin2SpyAfter','mixin1SpyAround','mixin2SpyAround','userCodeSpy'
 class Spies {
 mixin1SpyBefore = sinon.spy();
 mixin2SpyBefore = sinon.spy();
 mixin1SpyAfter = sinon.spy();
 mixin2SpyAfter = sinon.spy();
 mixin1SpyAround = sinon.spy();
 mixin2SpyAround = sinon.spy();
 userCodeSpy = sinon.spy();
 }
 function expectCallOrder(order:{name:string,spy:sinon.SinonSpy}[],calls:number=1){

 for(var i=0;i<order.length;i++){
 expect(order[i].spy,order[i].name).to.have.callCount(calls);
 if(i>0){
 expect(order[i].spy,order[i].name+' after '+order[i-1].name).to.have.been.calledAfter(order[i-1].spy)
 }
 }
 }

 function expectNoCalls(spies:{[name:string]:sinon.SinonSpy}){
 _forEach(spies,(element:sinon.SinonSpy) => {
 expect(element,name).to.have.callCount(0);
 });
 }

 function getSpiesOrder(spies: Spies) {
 return [{name: 'mixin1SpyBefore', spy: spies.mixin1SpyBefore},
 {name: 'mixin2SpyBefore', spy: spies.mixin2SpyBefore},
 {name: 'userCodeSpy', spy: spies.userCodeSpy},
 {name: 'mixin2SpyAfter', spy: spies.mixin2SpyAfter},
 {name: 'mixin1SpyAfter', spy: spies.mixin1SpyAfter}];
 }

 describe("mixin orchestrator", () => {
 const clientRenderer = new ClientRenderer();
 afterEach(() => clientRenderer.cleanup());

 describe('register: constructor',()=>{
 it('allows mutliple mixins to run code in constructor', () => {


 const mixin1Spy = sinon.spy();
 const mixin2Spy = sinon.spy();
 function mixin1<T>(cls:T):T{
 registerForConstructor(cls,mixin1Spy);
 return cls;
 }

 function mixin2<T>(cls:T):T{
 registerForConstructor(cls,mixin2Spy);
 return cls;
 }

 @mixin2
 @mixin1
 @orchastrated
 class MixinBaseComp<P,S> extends React.Component<P, S> {
 render() {
 return <div data-automation-id="test"></div>;
 }
 }

 class UserClass extends MixinBaseComp<any,any>{
 constructor(props:any,constext:any){
 expect(mixin1Spy).to.have.callCount(0);
 expect(mixin2Spy).to.have.callCount(0);
 super();
 expect(mixin1Spy).to.have.calledWith(this);
 expect(mixin2Spy).to.have.calledWith(this);
 expectCallOrder([{name:'mixin1Spy',spy:mixin1Spy},{name:'mixin2Spy',spy:mixin2Spy}]);
 }
 }

 renderToString(<UserClass></UserClass>);

 expect(mixin1Spy).to.have.callCount(1);
 expect(mixin2Spy).to.have.callCount(1);
 });

 })
 describe('life cycle hooks',()=>{
 const reactLifeCycleCreation:lifeCycleHookName[] = ['render','componentDidMount'];
 const reactLifeCycle:lifeCycleHookName[] = ['render','componentDidMount','componentWillReceiveProps','shouldComponentUpdate','componentWillUpdate','componentDidUpdate','componentWillUnmount'];

 reactLifeCycle.map((lifeCycleMethod)=>{
 const isCreationLifeCycle:boolean = reactLifeCycleCreation.indexOf(lifeCycleMethod)!=-1
 describe.assuming(inBrowser(),'inbrowser')('client side life cycle',()=>{
 describe('before and after: '+lifeCycleMethod,()=>{
 it('allows mutliple mixins to run code in '+lifeCycleMethod+' with user method', () => {
 const spies:Spies = new Spies();

 const spyOrder = getSpiesOrder(spies);

 //TODO generalize
 function mixin1<T>(cls:T):T{
 registerLifeCycle(cls,'before',lifeCycleMethod,spies.mixin1SpyBefore);
 registerLifeCycle(cls,'after',lifeCycleMethod,spies.mixin1SpyAfter);
 // registerLifeCycle(cls,'around',lifeCycleMethod,mixin1Spy);
 return cls;
 }
 function mixin2<T>(cls:T):T{
 registerLifeCycle(cls,'before',lifeCycleMethod,spies.mixin2SpyBefore);
 registerLifeCycle(cls,'after',lifeCycleMethod,spies.mixin2SpyAfter);
 return cls;
 }

 // TODO test using directly on user class
 // TODO test what happens when user overrides hooked method with calling super
 // TODO test what happens with no user nethod

 // define base class
 @mixin2
 @mixin1
 @orchastrated
 class MixinBaseComp<P,S> extends React.Component<P, S> {

 }

 // define final component class
 class UserClass extends MixinBaseComp<any,any>{
 render(){
 return <div></div>
 }
 }
 // simulate user overriding lifeCycleMethod with no call to super[lifeCycleMethod]
 (UserClass as any).prototype[lifeCycleMethod] = function(this:UserClass):any{
 spies.userCodeSpy();
 if(lifeCycleMethod==='render'){
 return <div></div>
 }
 };

 const {container} = clientRenderer.render(<div><UserClass></UserClass></div>);
 if(isCreationLifeCycle){
 expectCallOrder([...spyOrder]);
 }else{
 expectNoCalls(spies);
 }

 clientRenderer.render(<div><UserClass></UserClass></div>,container);

 switch(lifeCycleMethod){
 case 'render':
 //render should have been called twice
 expectCallOrder([...spyOrder,...spyOrder],2);
 break;
 case 'componentDidMount':
 //componentDidMount should have been called once (at first clientRenderer.render)
 expectCallOrder([...spyOrder]);
 break;
 case 'componentWillUnmount':
 expectNoCalls(spies);
 break;
 default:
 //'componentWillReceiveProps','shouldComponentUpdate','componentWillUpdate','componentDidUpdate' should have happened (at 2nd clientRenderer.render)
 expectCallOrder([...spyOrder]);
 break;

 }

 clientRenderer.render(<div></div>,container);

 switch(lifeCycleMethod){
 case 'render':
 //render should have been called twice
 expectCallOrder([...spyOrder,...spyOrder],2);
 break;
 case 'componentDidMount':
 //componentDidMount should have been called once (at first clientRenderer.render)
 expectCallOrder([...spyOrder]);
 break;
 case 'componentWillUnmount':
 expectCallOrder([...spyOrder]);
 break;
 default:
 //'componentWillReceiveProps','shouldComponentUpdate','componentWillUpdate','componentDidUpdate' should have happened (at 2nd clientRenderer.render)
 expectCallOrder([...spyOrder]);
 break;

 }
 });
 })
 });
 });

 })


 it('allows mixins to activate orchestrator automatically', () => {


 const mixin1Spy = sinon.spy();
 const mixin2Spy = sinon.spy();


 function mixin1<C extends ReactConstructor<any>>(cls:C):C{
 const oCls = orchastrated(cls);
 registerForConstructor(cls,mixin1Spy);
 return oCls;
 }

 function mixin2<C extends ReactConstructor<any>>(cls:C):C{
 const oCls = orchastrated(cls);
 registerForConstructor(cls,mixin2Spy);
 return oCls;
 }

 @mixin2
 @mixin1
 class MixinBaseComp<P,S> extends React.Component<P, S> {
 render() {
 return <div data-automation-id="test"></div>;
 }
 }

 class UserClass extends MixinBaseComp<any,any>{
 constructor(props:any,context:any){
 expect(mixin1Spy).to.have.callCount(0);
 expect(mixin2Spy).to.have.callCount(0);
 super();
 expect(mixin1Spy).to.have.callCount(1);
 expect(mixin1Spy).to.have.calledWith(this);
 expect(mixin2Spy).to.have.callCount(1);
 expect(mixin2Spy).to.have.calledWith(this);
 expect(mixin1Spy).to.have.been.calledBefore(mixin2Spy);
 }
 }


 renderToString(<UserClass></UserClass>);
 });
 });

 */
