/*global Vue Vuetify */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

var wd = new Vue({
  el: "#app",
  vuetify: new Vuetify({
    theme: {
      dark: false
    }
  }),
  data: {
    items: [
      {
        id: uuid(),
        idx: 1,
        name: "Vuetify Human Resources",
        fab: false,
        children: []
      }
    ],
    children_data: {
      1: [
        { id: uuid(), idx: 2, name: "Core team", fab: false, children: [] },
        {
          id: uuid(),
          idx: 3,
          name: "Administrators",
          fab: false,
          children: []
        },
        { id: uuid(), idx: 4, name: "Contributors", fab: false, children: [] }
      ],
      2: [
        { id: uuid(), name: "John", fab: false },
        { id: uuid(), name: "Kael", fab: false },
        { id: uuid(), name: "Nekosaur", fab: false },
        { id: uuid(), name: "Jacek", fab: false },
        { id: uuid(), name: "Andrew", fab: false }
      ],
      3: [
        { id: uuid(), name: "Ranee", fab: false },
        { id: uuid(), name: "Rachel", fab: false }
      ],
      4: [
        { id: uuid(), name: "Phlow", fab: false },
        { id: uuid(), name: "Brandon", fab: false },
        { id: uuid(), name: "Sean", fab: false }
      ]
    }
  },
  methods: {
    async load_ch(item) {
      console.log("load_ch", item);
      await sleep(1000);
      let ch = this.children_data[item.idx];
      item.children = [];
      for (let i = 0; i < ch.length; i++) {
        item.children.push(ch[i]);
      }
      console.log("after loading children", item);
      return ch.length;
    },
    clear() {
      //this.items.children[1].children = [];
      console.log("clear", this.items, this.children_data);
    },
    findItem(obj, id) {
      if (typeof id !== "string") {
        id = String(id);
      }
      for (let i = 0; i < obj.length; i++) {
        if (String(obj[i].id) === id) {
          return { item: obj[i], parent: obj, index: i };
        }
        if (obj[i].children) {
          const info = this.findItem(obj[i].children, id);
          if (info) return info;
        }
      }
      return null;
    },
    removeItem(obj, id, tid) {
      if (typeof id !== "string") {
        id = String(id);
      }
      if (typeof tid !== "string") {
        tid = String(tid);
      }
      let info = this.findItem(this.items, id);
      if (!info) return null;
      if (String(info.parent.id) === tid) {
        console.log("no move drop");
        return false;
      }
      return obj.splice(info.index, 1)[0];
    },
    async insertItem(obj, id, item) {
      if (typeof id !== "string") {
        id = String(id);
      }
      for (let i = 0; i < obj.length; i++) {
        if (String(obj[i].id) === id) {
          if (!obj[i].children.length) {
            await this.load_ch(obj[i]);
          }
          obj[i].children.push(item);
          return true;
        }
        if (obj[i].children) {
          const inserted = await this.insertItem(obj[i].children, id, item);
          if (inserted) return true;
        }
      }
      return false;
    },
    async move(info) {
      // we finally capture and process the custom event here
      console.log("move!", info);
      const item = this.removeItem(this.items, info.from, info.to);
      if (item) {
        console.log("move item!", item);
        await this.insertItem(this.items, info.to, item);
        console.log(item, this.items);
      }
    }
  }
});
