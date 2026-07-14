import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
      textStyle: {
        setColor: (color: string) => ReturnType
      }
    }
  }

type EditorExtensions = [
  typeof StarterKit,
  typeof Link,
  typeof TextStyle,
  typeof Color,
  typeof Highlight,
  typeof TextAlign,
  typeof BulletList,
  typeof OrderedList
]

export type CustomEditor = Editor


