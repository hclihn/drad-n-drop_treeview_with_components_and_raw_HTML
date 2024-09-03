/*global Vue set_style_mixin */
// common properties of both components
const dndTreeCommonMixin = {
  props: {
    expandIcon: {
      // expansion icon
      type: String,
      default: "mdi-menu-down"
    },
    dense: {
      // dense layout?
      type: Boolean,
      default: false
    },
    rounded: {
      // rounded shape?
      type: Boolean,
      default: false
    },
    shaped: {
      // shaped?
      type: Boolean,
      default: false
    },
    dark: {
      // dark?
      type: Boolean,
      default: false
    },
    light: {
      // light?
      type: Boolean,
      default: false
    },
    rootDraggable: {
      // is root level draggable?
      type: Boolean,
      default: false
    },
    loadChildren: {
      // load-children callback
      type: Function,
      default: null
    }
  },
  model: {
    prop: "value",
    event: "input"
  }
};

// The propagation of events in Vue is pretty well controlled. Events up, properties down.
// And they only go up 1 level.
// <!-- listen for message and pass on message -->
// <parent-component @message="$emit('message', $event)">
let DraggableTreeViewNode = Vue.component("draggable-tree-view-node", {
  mixins: [set_style_mixin, dndTreeCommonMixin],
  props: {
    level: {
      type: Number,
      default: 0
    },
    value: {
      type: Object,
      validator: (v) => {
        const t = ["string", "number"];
        if (v && typeof v === "object" && v.hasOwnProperty("id")) {
          return t.indexOf(typeof v.id) >= 0;
        }
        return false;
      }
    }
  },
  data() {
    return {
      open: false,
      loading_ch: false,
      atDrop: false,
      localValue: { ...this.value }
    };
  },
  computed: {
    hasChildren() {
      return this.value.children != null; // && this.value.children.length > 0;
    },
    appendLevel() {
      return this.level + (this.hasChildren ? 0 : 1);
    },
    id() {
      return this.localValue.id;
    },
    childrenLength() {
      if (this.localValue.children) return this.localValue.children.length;
      return null;
    }
  },
  watch: {
    value(value) {
      console.log("watch item value", value);
      this.localValue = { ...value };
    }
  },
  methods: {
    updateChildValue(value) {
      console.log("update child value", this.localValue.id, value.id, value);
      const index = this.localValue.children.findIndex(
        (c) => c.id === value.id
      );
      this.$set(this.localValue.children, index, value);
      this.$emit("input", this.localValue);
    },
    set(prop, val) {
      this.$set(this.localValue, prop, val);
      this.$emit("input", this.localValue);
    },
    get(prop) {
      if (!prop) {
        return this.localValue;
      }
      return this.localValue[prop];
    },
    dragStart(event) {
      event.stopPropagation();
      if (event.altKey) {
        event.dataTransfer.effectAllowed = "copy";
      } else {
        event.dataTransfer.effectAllowed = "move";
      }
      event.dataTransfer.setData("draggable-tree-view-node", String(this.id));
      event.target.style.opacity = 0.3;
      console.log("drag start, src.id", event.target.id, this.id, event);
    },
    dragEnd(event) {
      event.stopPropagation();
      event.target.style.opacity = "";
    },
    dragOver(event) {
      event.preventDefault();
      event.stopPropagation();
      this.atDrop = true;
      //console.log("drag over", this.id(), event.target, event);
    },
    dragLeave(event) {
      event.stopPropagation();
      this.atDrop = false;
    },
    drop(event) {
      event.preventDefault();
      event.stopPropagation();
      const action = event.dataTransfer.effectAllowed;
      const data = event.dataTransfer.getData("draggable-tree-view-node");
      this.atDrop = false; //this.addRmClass(to, "droparea", false);
      if (data === String(this.id)) {
        // move to self
        console.log("move to self", data, this.id);
        return;
      }
      const re = new RegExp(/(^|\s+)v-treeview-node(\s+|$)/, "g");
      let p = event.target;
      for (; p; p = p.parentElement) {
        if (p.className.search(re) >= 0) {
          break;
        }
      }

      this.$emit("move", { from: data, to: this.id, action: action });
      console.log(
        "dropped",
        action,
        data,
        this.id,
        p ? p.id : "x",
        event,
        this
      );
    },
    addChild(...items) {
      if (!items.length) return;
      let ch = this.localValue.children;
      for (let j = 0; j < items.length; j++) {
        const item = items[j];
        let found = false;
        for (let i = 0; i < ch.length; i++) {
          if (String(ch[i].id) === String(item.id)) {
            ch[i] = item;
            found = true;
            break;
          }
        }
        if (!found) {
          ch.push(item);
        }
      }
      this.$emit("input", this.localValue);
      return;
    },
    rmChild(...ids) {
      if (!ids.length) return null;
      let ch = this.localValue.children;
      let rt = [];
      for (let j = 0; j < ids.length; j++) {
        let id = String(ids[j]);
        for (let i = 0; i < ch.length; i++) {
          if (String(ch[i].id) === id) {
            rt.push(ch.splice(i, 1)[0]);
            break;
          }
        }
      }
      if (rt.length) {
        this.$emit("input", this.localValue);
      }
      return rt;
    },
    async load_children() {
      if (this.loading_ch) {
        //console.log("load_children busy");
        return false;
      }
      //console.log("item load ch");
      this.loading_ch = true;
      if (this.localValue.children.length) this.localValue.children = [];
      await this.loadChildren(this.localValue);
      this.loading_ch = false;
      this.$emit("input", this.localValue);
      return true;
    },
    async toggleOpen() {
      if (
        !this.open &&
        this.localValue.children &&
        !this.localValue.children.length &&
        this.loadChildren
      ) {
        //console.log("item loading ch");
        await this.load_children();
      }
      this.open = !this.open;
    }
  },
  template: `<div class='draggable-tree-view-node'>
  <div
    :class="['v-treeview-node', 'v-treeview-node--click',
      {'v-treeview-node--leaf': hasChildren, 'v-treeview--dense': dense,
        'v-treeview-node--rounded': rounded, 'v-treeview-node--shaped': shaped,
        'droparea': atDrop}]"
      v-on="hasChildren? {drop: drop, dragover: dragOver, dragleave: dragLeave}:{}"
      @dragstart="(rootDraggable || level) && dragStart($event)"
      @dragend="(rootDraggable || level) && dragEnd($event)"
      :draggable="(rootDraggable || level)?'true':'false'"
      :id="value.id">
    <div class="v-treeview-node__root">
      <div
        v-for="index in appendLevel"
        :key="index"
        class="v-treeview-node__level"
      />
      <button
        v-if="hasChildren"
        class="v-icon notranslate v-treeview-node__toggle v-icon--link"
        :class="[
          {
            'v-treeview-node__toggle--open': open,
            'theme--dark': dark,
            'theme--light': light,
            'loading-rotate': loading_ch,
          }]" @click="toggleOpen"
      ><v-icon>{{loading_ch? 'mdi-autorenew' : expandIcon}}</v-icon></button>
      <slot name="prepend" v-bind="{ item: value, open }" />
      <div class="v-treeview-node__label">
        <slot name="label" v-bind="{ item: value, open }">
          {{ value.name }}
        </slot>
      </div>
      <slot name="append" v-bind="{ item: value }" />
    </div>
    <div
      v-if="open"
      class="v-treeview-node__children"
    >
        <draggable-tree-view-node
          v-for="child in localValue.children"
          :key="child.id"
          :ref="child.id"
          :value="child"
          :level="level+1"
          :expand-icon="expandIcon"
          :dense="dense"
          :rounded="rounded"
          :shaped="shaped"
          :dark="dark"
          :light="light"
          :root-draggable="rootDraggable"
          :load-children="loadChildren"
          @input="updateChildValue"
          @move="$emit('move', $event)"
        >
          <template v-slot:prepend="{ item, open }">
            <slot name="prepend" v-bind="{ item, open }" />
          </template>
          <template v-slot:label="{ item, open }">
            <slot name="label" v-bind="{ item, open }"></slot>
          </template>
          <template v-slot:append="{ item }">
            <slot name="append" v-bind="{ item }" />
          </template>
        </draggable-tree-view-node>
    </div>
  </div></div>
  `,
  styles: `
  .draggable-tree-view-node .droparea {
    outline: 1px solid green;
  }
  .draggable-tree-view-node .v-treeview-node__root:hover {
    background-color: rgba(210,210, 210, 0.2);
  }
  .draggable-tree-view-node .loading-rotate {
    animation: draggable-tree-view-node-loading-rotation 1s infinite linear;
  }
  @keyframes draggable-tree-view-node-loading-rotation {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  `
});

Vue.component("v-draggable-treeview", {
  mixins: [dndTreeCommonMixin],
  components: {
    DraggableTreeViewNode
  },
  props: {
    value: {
      type: Array,
      default: [],
      validator: (v) => {
        const t = ["string", "number"];
        return v.every((e) => {
          if (e && typeof e === "object" && e.hasOwnProperty("id")) {
            return t.indexOf(typeof e.id) >= 0;
          }
          return false;
        });
      }
    },
    dndMove: {
      type: Function,
      default: null
    }
  },
  data() {
    return {
      localValue: [...this.value]
    };
  },
  watch: {
    value(value) {
      console.log("watch value", value);
      this.localValue = [...value];
    }
  },
  methods: {
    updateItem(itemValue) {
      console.log("update item", itemValue);
      const index = this.localValue.findIndex((v) => v.id === itemValue.id);
      this.$set(this.localValue, index, itemValue);
      this.$emit("input", this.localValue);
    },
    findItemObj(obj, id) {
      if (typeof id !== "string") {
        id = String(id);
      }
      for (let ref in obj.$refs) {
        if (String(ref) === id && obj.$refs[ref].length) {
          return { obj: obj.$refs[ref][0], parent: obj };
        }
        if (obj.$refs[ref].length) {
          let info = this.findItemObj(obj.$refs[ref][0], id);
          if (info.obj) return info;
        }
      }
      return { obj: null, parent: null };
    },
    async removeItem(id, tid) {
      let { obj, parent } = this.findItemObj(this, id);
      //console.log("removeItem", item, parent);
      if (obj) {
        if (String(tid) === String(parent.id)) {
          console.log("no move drop");
          return false;
        }
        const l = parent.childrenLength;
        if (l === null) return null;
        if (!l && this.loadChildren) {
          await parent.load_children();
        }
        return parent.rmChild(id);
      }
      return null;
    },
    async insertItem(id, item) {
      let { obj } = this.findItemObj(this, id);
      if (obj) {
        const l = obj.childrenLength;
        if (l === null) return false;
        if (!l && this.loadChildren) {
          await obj.load_children();
        }
        obj.addChild(item);
        return true;
      }
      //console.log("inserItem not found", id);
      return false;
    },
    async moveTree(info) {
      // we finally capture and process the custom event here
      if (info.action === "move") {
        const { parent } = this.findItemObj(this, info.from);
        if (parent && String(info.to) === String(parent.id)) {
          // target parent is the current parent, no-op
          console.log("move: same paretnt move, no-op");
          return;
        }
      }
      if (this.dndMove) {
        console.log("dnd-move", info);
        await this.dndMove(info);
      } else if (info.action === "move") {
        console.log("move", info);
        const items = await this.removeItem(info.from, info.to);
        if (items.length) {
          console.log("move item", items);
          await this.insertItem(info.to, items[0]);
        }
        this.$emit("input", this.localValue);
      } else {
        // copy
        let { obj: from } = this.findItemObj(this, info.from);
        let { obj: to } = this.findItemObj(this, info.to);
        // make a deep copy of from item
        let item = JSON.parse(JSON.stringify(from.get(null)));
      }
    }
  },
  template: `
  <div>
    <draggable-tree-view-node
      v-for="item in localValue"
      :key="item.id"
      :ref="item.id"
      :value="item"
      :expand-icon="expandIcon"
      :dense="dense"
      :rounded="rounded"
      :shaped="shaped"
      :dark="dark"
      :light="light"
      :root-draggable="rootDraggable"
      :load-children="loadChildren"
      @input="updateItem"
      @move="moveTree" 
    >
      <template v-slot:prepend="{ item, open }">
        <slot name="prepend" v-bind="{ item, open }"> </slot>
      </template>
      <template v-slot:label="{ item, open }">
        <slot name="label" v-bind="{ item, open }"> </slot>
      </template>
      <template v-slot:append="{ item, open }">
        <slot name="append" v-bind="{ item, open }"> </slot>
      </template>
    </draggable-tree-view-node>
  </div>
  `
});
