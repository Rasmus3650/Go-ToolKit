/**
 * Roundcube Webmail Client Script
 *
 * This file is part of the Roundcube Webmail client
 *
 * @licstart  The following is the entire license notice for the
 * JavaScript code in this file.
 *
 * Copyright (C) The Roundcube Dev Team
 * Copyright (C) Kolab Systems AG
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 *
 * @author Thomas Bruederli <roundcube@gmail.com>
 * @author Aleksander 'A.L.E.C' Machniak <alec@alec.pl>
 * @author Charles McNulty <charles@charlesmcnulty.com>
 *
 * @requires jquery.js, common.js, list.js
 */
function rcube_webmail() {
    this.labels = {},
    this.buttons = {},
    this.buttons_sel = {},
    this.gui_objects = {},
    this.gui_containers = {},
    this.commands = {},
    this.command_handlers = {},
    this.onloads = [],
    this.messages = {},
    this.group2expand = {},
    this.http_request_jobs = {},
    this.menu_stack = [],
    this.menu_buttons = {},
    this.entity_selectors = [],
    this.image_style = {},
    this.uploads = {},
    this.dblclick_time = 500,
    this.message_time = 5e3,
    this.preview_delay_select = 400,
    this.preview_delay_click = 60,
    this.identifier_expr = /[^0-9a-z_-]/gi,
    this.uploadTimeout = 0,
    this.env = {
        attachments: {},
        request_timeout: 180,
        draft_autosave: 0,
        comm_path: "./",
        recipients_separator: ",",
        recipients_delimiter: ", ",
        popup_width: 1150,
        popup_width_small: 900,
        thread_padding: "15px"
    },
    this.ref = "rcmail";
    var ref = this;
    $.ajaxSetup({
        cache: !1,
        timeout: 1e3 * this.env.request_timeout,
        error: function(e, t, s) {
            ref.http_error(e, t, s)
        },
        beforeSend: function(e) {
            e.setRequestHeader("X-Roundcube-Request", ref.env.request_token)
        }
    }),
    $(window).on("beforeunload", function() {
        ref.unload = !0
    }),
    this.set_env = function(e, t) {
        if (null == e || "object" != typeof e || t)
            this.env[e] = t;
        else
            for (var s in e)
                this.env[s] = e[s]
    }
    ,
    this.add_label = function(e, t) {
        "string" == typeof e ? this.labels[e] = t : "object" == typeof e && $.extend(this.labels, e)
    }
    ,
    this.register_button = function(e, t, s, i, n, a) {
        s = {
            id: t,
            type: s
        };
        i && (s.act = i),
        n && (s.sel = n),
        a && (s.over = a),
        this.buttons[e] || (this.buttons[e] = []),
        this.buttons[e].push(s),
        this.loaded && (this.init_button(e, s),
        this.set_button(e, this.commands[e] ? "act" : "pas"))
    }
    ,
    this.register_menu_button = function(e, t) {
        var s;
        this.menu_buttons[t] ? this.menu_buttons[t][0].push(e) : (s = [],
        $("#" + t).find("a").each(function() {
            var e = $(this)
              , t = e.attr("onclick")
              , t = t && String(t).match(/rcmail\.command\(\'([^']+)/) ? RegExp.$1 : function() {
                return e.is(".active")
            }
            ;
            s.push(t)
        }),
        s.length && (this.menu_buttons[t] = [[e], s])),
        this.set_menu_buttons()
    }
    ,
    this.set_menu_buttons = function() {
        clearTimeout(this.menu_buttons_timeout),
        this.menu_buttons_timeout = setTimeout(function() {
            $.each(ref.menu_buttons, function() {
                var t = !0;
                $.each(this[1], function() {
                    var e = "function" == typeof this;
                    if (e && this() || !e && ref.commands[this])
                        return t = !1
                }),
                $(this[0]).add($(this[0]).parent(".dropbutton")).addClass(t ? "disabled" : "active").removeClass(t ? "active" : "disabled")
            })
        }, 50)
    }
    ,
    this.gui_object = function(e, t) {
        this.gui_objects[e] = this.loaded ? rcube_find_object(t) : t
    }
    ,
    this.gui_container = function(e, t) {
        this.gui_containers[e] = t
    }
    ,
    this.add_element = function(e, t) {
        this.gui_containers[t] && this.gui_containers[t].jquery && this.gui_containers[t].append(e)
    }
    ,
    this.register_command = function(e, t, s) {
        this.command_handlers[e] = t,
        s && this.enable_command(e, !0)
    }
    ,
    this.add_onload = function(e) {
        this.onloads.push(e)
    }
    ,
    this.init = function() {
        var n, searchfilter;
        for (n in this.task = this.env.task,
        this.env.blankpage || (this.env.blankpage = "javascript:false;"),
        this.gui_containers)
            this.gui_containers[n] = $("#" + this.gui_containers[n]);
        for (n in this.gui_objects)
            this.gui_objects[n] = rcube_find_object(this.gui_objects[n]);
        switch (this.init_buttons(),
        this.is_framed() && parent.rcmail.unlock_frame(),
        this.enable_command("close", "logout", "mail", "addressbook", "settings", "save-pref", "compose", "undo", "about", "switch-task", "menu-open", "menu-close", "menu-save", !0),
        this.set_button(this.task, "sel"),
        this.env.permaurl && this.enable_command("permaurl", "extwin", !0),
        this.task) {
        case "mail":
            this.enable_command("list", "checkmail", "add-contact", "search", "reset-search", "collapse-folder", "import-messages", !0),
            this.gui_objects.messagelist && (this.msglist_setup(this.env.layout),
            this.env.widescreen_list_template = [{
                className: "threads",
                cells: ["threads"]
            }, {
                className: "subject",
                cells: ["fromto", "date", "size", "status", "subject"]
            }, {
                className: "flags",
                cells: ["flag", "attachment"]
            }],
            this.message_list = new rcube_list_widget(this.gui_objects.messagelist,{
                multiselect: !0,
                multiexpand: !0,
                draggable: !0,
                keyboard: !0,
                column_movable: this.env.col_movable,
                dblclick_time: this.dblclick_time
            }),
            this.message_list.addEventListener("initrow", function(e) {
                ref.init_message_row(e)
            }).addEventListener("dblclick", function(e) {
                ref.msglist_dbl_click(e)
            }).addEventListener("keypress", function(e) {
                ref.msglist_keypress(e)
            }).addEventListener("select", function(e) {
                ref.msglist_select(e)
            }).addEventListener("dragstart", function(e) {
                ref.drag_start(e)
            }).addEventListener("dragmove", function(e) {
                ref.drag_move(e)
            }).addEventListener("dragend", function(e) {
                ref.drag_end(e)
            }).addEventListener("expandcollapse", function(e) {
                ref.msglist_expand(e)
            }).addEventListener("column_replace", function(e) {
                ref.msglist_set_coltypes(e)
            }).init(),
            $(this.message_list.thead).on("click", "a.sortcol", function(e) {
                return ref.command("sort", $(this).attr("rel"), this)
            }),
            this.enable_command("toggle_status", "toggle_flag", "sort", !0),
            this.enable_command("set-listmode", this.env.threads && !this.is_multifolder_listing()),
            searchfilter = $(this.gui_objects.search_filter).val(),
            searchfilter && "ALL" != searchfilter ? this.filter_mailbox(searchfilter) : this.command("list"),
            $(this.gui_objects.qsearchbox).val(this.env.search_text).focusin(function() {
                ref.message_list.blur()
            })),
            this.set_button_titles(),
            this.env.message_commands = ["show", "reply", "reply-all", "reply-list", "move", "copy", "delete", "open", "mark", "edit", "viewsource", "bounce", "print", "load-attachment", "download-attachment", "show-headers", "hide-headers", "download", "forward", "forward-inline", "forward-attachment", "change-format"],
            "show" == this.env.action || "preview" == this.env.action ? (this.enable_command(this.env.message_commands, this.env.uid),
            this.enable_command("reply-list", this.env.list_post),
            "show" == this.env.action && this.http_request("pagenav", {
                _uid: this.env.uid,
                _mbox: this.env.mailbox,
                _search: this.env.search_request
            }, this.display_message("", "loading")),
            0 < this.env.mail_read_time && setTimeout(function() {
                ref.http_post("mark", {
                    _uid: ref.env.uid,
                    _flag: "read",
                    _mbox: ref.env.mailbox,
                    _quiet: 1
                })
            }, 1e3 * this.env.mail_read_time),
            this.env.blockedobjects && ($(this.gui_objects.remoteobjectsmsg).show(),
            this.enable_command("load-remote", !0)),
            "preview" == this.env.action && this.is_framed() && (this.enable_command("compose", "add-contact", !1),
            parent.rcmail.show_contentframe(!0)),
            0 <= $.inArray("flagged", this.env.message_flags) && $(document.body).addClass("status-flagged"),
            this.gui_objects.attachments && $("li > a", this.gui_objects.attachments).not(".drop").on("dragstart", function(e) {
                var t = this.href
                  , s = e.originalEvent.dataTransfer;
                s && (t = t.replace(/^https?:\/\//, function(e) {
                    return e + urlencode(ref.env.username) + "@"
                }),
                (e = $(this).clone()).children().remove(),
                s.setData("roundcube-uri", t),
                s.setData("roundcube-name", e.text().trim()))
            }),
            this.check_mailvelope(this.env.action)) : "compose" == this.env.action ? (this.env.address_group_stack = [],
            this.env.compose_commands = ["send-attachment", "remove-attachment", "send", "cancel", "toggle-editor", "list-addresses", "pushgroup", "search", "reset-search", "extwin", "insert-response", "menu-open", "menu-close", "load-attachment", "download-attachment", "open-attachment", "rename-attachment"],
            this.env.drafts_mailbox && this.env.compose_commands.push("savedraft"),
            this.enable_command(this.env.compose_commands, !0),
            $.merge(this.env.compose_commands, ["add-recipient", "firstpage", "previouspage", "nextpage", "lastpage"]),
            window.googie && (this.env.editor_config.spellchecker = googie,
            this.env.editor_config.spellcheck_observer = function(e) {
                ref.spellcheck_state()
            }
            ,
            this.env.compose_commands.push("spellcheck"),
            this.enable_command("spellcheck", !0)),
            this.editor_init(null, this.env.composebody),
            this.init_messageform(),
            this.check_mailvelope(this.env.action)) : "bounce" == this.env.action ? (this.init_messageform_inputs(),
            this.env.compose_commands = []) : "get" == this.env.action ? (this.enable_command("download", !0),
            this.enable_command("image-scale", "image-rotate", !!/^image\//.test(this.env.mimetype)),
            this.enable_command("print", "application/pdf" != this.env.mimetype || !bw.mz || 75 <= bw.vendver),
            this.env.is_message && (this.enable_command("reply", "reply-all", "edit", "viewsource", "forward", "forward-inline", "forward-attachment", "bounce", !0),
            this.env.list_post && this.enable_command("reply-list", !0)),
            this.env.mimetype.startsWith("image/") && $(this.gui_objects.messagepartframe).on("load", function() {
                var e = $(this).contents();
                e.find("img").length && e.find("head").append('<style type="text/css">img { max-width:100%; max-height:100%; } body { display:flex; align-items:center; justify-content:center; height:100%; margin:0; }</style>')
            })) : "print" == this.env.action && this.env.uid && (this.check_mailvelope(this.env.action),
            this.env.is_pgp_content || this.env.pgp_mime_part || this.print_dialog()),
            this.gui_objects.mailboxlist && (this.env.unread_counts = {},
            this.gui_objects.folderlist = this.gui_objects.mailboxlist,
            this.http_request("getunread", {
                _page: this.env.current_page
            })),
            this.gui_objects.contactslist && (this.contact_list = new rcube_list_widget(this.gui_objects.contactslist,{
                multiselect: !0,
                draggable: !1,
                keyboard: !0
            }),
            this.contact_list.addEventListener("initrow", function(e) {
                ref.triggerEvent("insertrow", {
                    cid: e.uid,
                    row: e
                })
            }).addEventListener("select", function(e) {
                ref.compose_recipient_select(e)
            }).addEventListener("dblclick", function(e) {
                ref.compose_add_recipient()
            }).addEventListener("keypress", function(e) {
                e.key_pressed == e.ENTER_KEY && (ref.compose_add_recipient() || e.last_selected && "G" == String(e.last_selected).charAt(0) && $(e.rows[e.last_selected].obj).find("a").first().click())
            }).init(),
            $("#_to,#_cc,#_bcc").focus(function() {
                ref.env.focused_field = this
            })),
            this.gui_objects.addressbookslist && (this.gui_objects.folderlist = this.gui_objects.addressbookslist,
            this.enable_command("list-addresses", !0)),
            this.env.mdn_request && this.env.uid && this.mdn_request_dialog(this.env.uid, this.env.mailbox),
            this.is_framed() || this.env.extwin || this.browser_capabilities_check();
            break;
        case "addressbook":
            this.env.address_group_stack = [],
            this.gui_objects.folderlist && (this.env.contactfolders = $.extend($.extend({}, this.env.address_sources), this.env.contactgroups)),
            this.enable_command("add", "import", this.env.writable_source),
            this.enable_command("list", "listgroup", "pushgroup", "popgroup", "listsearch", "search", "reset-search", "advanced-search", !0),
            this.gui_objects.contactslist && (this.contact_list = new rcube_list_widget(this.gui_objects.contactslist,{
                multiselect: !0,
                draggable: !!this.gui_objects.folderlist,
                keyboard: !0
            }),
            this.contact_list.addEventListener("initrow", function(e) {
                ref.triggerEvent("insertrow", {
                    cid: e.uid,
                    row: e
                })
            }).addEventListener("keypress", function(e) {
                ref.list_keypress(e)
            }).addEventListener("select", function(e) {
                ref.contactlist_select(e)
            }).addEventListener("dragstart", function(e) {
                ref.drag_start(e)
            }).addEventListener("dragmove", function(e) {
                ref.drag_move(e)
            }).addEventListener("dragend", function(e) {
                ref.drag_end(e)
            }).init(),
            $(this.gui_objects.qsearchbox).focusin(function() {
                ref.contact_list.blur()
            }),
            this.update_group_commands(),
            this.command("list")),
            this.gui_objects.savedsearchlist && (this.savedsearchlist = new rcube_treelist_widget(this.gui_objects.savedsearchlist,{
                id_prefix: "rcmli",
                id_encode: this.html_identifier_encode,
                id_decode: this.html_identifier_decode
            }),
            this.savedsearchlist.addEventListener("select", function(e) {
                ref.triggerEvent("selectfolder", {
                    folder: e.id,
                    prefix: "rcmli"
                })
            })),
            this.set_page_buttons(),
            this.env.cid && (this.enable_command("show", "edit", "qrcode", !0),
            this.gui_objects.editform && $("input.groupmember").change(function() {
                ref.group_member_change(this.checked ? "add" : "del", ref.env.cid, ref.env.source, this.value)
            })),
            this.gui_objects.editform ? (this.enable_command("save", !0),
            "add" != this.env.action && "edit" != this.env.action && "search" != this.env.action || this.init_contact_form()) : "print" == this.env.action && this.print_dialog();
            break;
        case "settings":
            this.enable_command("show", "save", !0),
            "identities" == this.env.action ? this.enable_command("add", this.env.identities_level < 2) : "edit-identity" == this.env.action || "add-identity" == this.env.action ? (this.enable_command("save", "edit", !0),
            this.enable_command("delete", this.env.identities_level < 2),
            "edit-identity" == this.env.action && this.check_mailvelope(this.env.action)) : "folders" == this.env.action ? this.enable_command("subscribe", "unsubscribe", "create-folder", "rename-folder", !0) : "edit-folder" == this.env.action && this.gui_objects.editform ? (this.enable_command("save", "folder-size", !0),
            parent.rcmail.env.exists = this.env.messagecount,
            parent.rcmail.enable_command("purge", this.env.messagecount)) : "responses" == this.env.action && this.enable_command("add", !0),
            this.gui_objects.identitieslist ? (this.identity_list = new rcube_list_widget(this.gui_objects.identitieslist,{
                multiselect: !1,
                draggable: !1,
                keyboard: !0
            }),
            this.identity_list.addEventListener("select", function(e) {
                ref.identity_select(e)
            }).addEventListener("keypress", function(e) {
                ref.list_keypress(e)
            }).init().focus()) : this.gui_objects.sectionslist ? (this.sections_list = new rcube_list_widget(this.gui_objects.sectionslist,{
                multiselect: !1,
                draggable: !1,
                keyboard: !0
            }),
            this.sections_list.addEventListener("select", function(e) {
                ref.section_select(e)
            }).init().focus()) : this.gui_objects.subscriptionlist ? this.init_subscription_list() : this.gui_objects.responseslist && (this.responses_list = new rcube_list_widget(this.gui_objects.responseslist,{
                multiselect: !1,
                draggable: !1,
                keyboard: !0
            }),
            this.responses_list.addEventListener("select", function(e) {
                ref.response_select(e)
            }).addEventListener("keypress", function(e) {
                ref.list_keypress(e)
            }).init().focus());
            break;
        case "login":
            var tz, tz_name, input_user = $("#rcmloginuser"), input_tz = $("#rcmlogintz");
            ("" == input_user.val() ? input_user : $("#rcmloginpwd")).focus(),
            window.jstz && (tz = jstz.determine()) && (tz_name = tz.name()),
            input_tz.val(tz_name || (new Date).getStdTimezoneOffset() / -60),
            $("form").submit(function() {
                $("[type=submit]", this).prop("disabled", !0),
                ref.clear_messages(),
                ref.display_message("", "loading")
            })
        }
        this.gui_objects.editform && $("input,select,textarea", this.gui_objects.editform).not(":hidden").not(":disabled").first().select().focus(),
        bw.ie && $("input[type=file]").keydown(function(e) {
            "13" == e.keyCode && e.preventDefault()
        }),
        this.loaded = !0,
        this.env.lastrefresh = new Date,
        this.pending_message && this.display_message.apply(this, this.pending_message),
        this.gui_objects.folderlist && window.rcube_treelist_widget && this.gui_objects.folderlist != this.gui_objects.addressbookslist && (this.treelist = new rcube_treelist_widget(this.gui_objects.folderlist,{
            selectable: !0,
            id_prefix: "rcmli",
            parent_focus: !0,
            id_encode: this.html_identifier_encode,
            id_decode: this.html_identifier_decode,
            check_droptarget: function(e) {
                return !e.virtual && ref.check_droptarget(e.id)
            }
        }),
        this.treelist.addEventListener("collapse", function(e) {
            ref.folder_collapsed(e)
        }).addEventListener("expand", function(e) {
            ref.folder_collapsed(e)
        }).addEventListener("beforeselect", function(e) {
            return !ref.busy
        }).addEventListener("select", function(e) {
            ref.triggerEvent("selectfolder", {
                folder: e.id,
                prefix: "rcmli"
            }),
            ref.mark_all_read_state()
        })),
        this.gui_objects.filedrop && this.env.filedrop && window.FormData && ($(document.body).on("dragover dragleave drop", function(e) {
            return ref.document_drag_hover(e, "dragover" == e.type)
        }),
        $(this.gui_objects.filedrop).addClass("droptarget").on("dragover dragleave", function(e) {
            return ref.file_drag_hover(e, "dragover" == e.type)
        }).get(0).addEventListener("drop", function(e) {
            return ref.file_dropped(e)
        }, !1));
        var body_mouseup = function(e) {
            return ref.doc_mouse_up(e)
        };
        for (n in $(document.body).mouseup(body_mouseup).keydown(function(e) {
            return ref.doc_keypress(e)
        }),
        rcube_webmail.set_iframe_events({
            mouseup: body_mouseup
        }),
        this.triggerEvent("init", {
            task: this.task,
            action: this.env.action
        }),
        this.onloads)
            "string" == typeof this.onloads[n] ? eval(this.onloads[n]) : "function" == typeof this.onloads[n] && this.onloads[n]();
        $("[data-popup]").each(function() {
            ref.register_menu_button(this, $(this).data("popup"))
        }),
        this.start_refresh(),
        this.start_keepalive()
    }
    ,
    this.log = function(e) {
        this.env.devel_mode && window.console && console.log && console.log(e)
    }
    ,
    this.command = function(e, t, s, i, n) {
        if (!s || !s.blur || i && rcube_event.is_keyboard(i) || s.blur(),
        this.busy && ("reset-search" != e || "search" != this.last_command) && !e.match(/^menu-/))
            return !1;
        if (s && s.href && String(s.href).indexOf("#") < 0 && rcube_event.get_modifier(i))
            return !0;
        if (!n && !this.commands[e])
            return this.is_framed() && parent.rcmail.command(e, t),
            !1;
        if ("mail" == this.task && "compose" == this.env.action && !this.env.server_error && "save-pref" != e && ($.inArray(e, this.env.compose_commands) < 0 || e.startsWith("compose-encrypted") && ref.mailvelope_editor) && !this.compose_skip_unsavedcheck && !this.env.is_sent && this.cmp_hash != this.compose_field_hash())
            return this.confirm_dialog(this.get_label("notsentwarning"), "discard", function() {
                ref.remove_compose_data(ref.env.compose_id),
                ref.compose_skip_unsavedcheck = !0,
                ref.command(e, t, s, i)
            }),
            !1;
        if (this.last_command = e,
        this.command_aborted = !1,
        this.triggerEvent("actionbefore", {
            props: t,
            action: e,
            originalEvent: i
        }),
        void 0 !== (n = this.triggerEvent("before" + e, t || i))) {
            if (!1 === n)
                return !1;
            t = n
        }
        return n = "function" == typeof this.command_handlers[e] ? this.command_handlers[e](t, s, i) : "string" == typeof this.command_handlers[e] ? window[this.command_handlers[e]](t, s, i) : this.command_handler(e, t, s, i),
        this.command_aborted || !1 !== this.triggerEvent("after" + e, t) || (n = !1),
        this.triggerEvent("actionafter", {
            props: t,
            action: e,
            aborted: this.command_aborted,
            ret: n,
            originalEvent: i
        }),
        !1 !== n && !(s && !0 !== n || !0 === this.command_aborted)
    }
    ,
    this.command_handler = function(e, t, s, i) {
        var n, a, r;
        switch (e) {
        case "logout":
        case "mail":
        case "addressbook":
        case "settings":
            this.switch_task(e);
            break;
        case "about":
            this.redirect("?_task=settings&_action=about", !1);
            break;
        case "permaurl":
            if (s && s.href && s.target)
                return !0;
            this.env.permaurl && (parent.location.href = this.env.permaurl);
            break;
        case "extwin":
            "compose" == this.env.action ? (m = this.gui_objects.messageform,
            (l = this.open_window("")) && (this.save_compose_form_local(),
            this.compose_skip_unsavedcheck = !0,
            $("[name='_action']", m).val("compose"),
            m.action = this.url("mail/compose", {
                _id: this.env.compose_id,
                _extwin: 1
            }),
            m.target = l.name,
            m.submit())) : this.open_window(this.env.permaurl, !0);
            break;
        case "change-format":
            a = this.env.permaurl + "&_format=" + t,
            "preview" == this.env.action && (a = a.replace(/_action=show/, "_action=preview") + "&_framed=1"),
            this.env.extwin && (a += "&_extwin=1"),
            location.href = a;
            break;
        case "menu-open":
            t && "attachmentmenu" == t.menu && ((c = this.env.attachments[t.id]) && c.mimetype && (c = c.mimetype),
            this.enable_command("open-attachment", c && this.env.mimetypes && 0 <= $.inArray(c, this.env.mimetypes))),
            this.show_menu(t, t.show || void 0, i);
            break;
        case "menu-close":
            this.hide_menu(t, i);
            break;
        case "menu-save":
            return this.triggerEvent(e, {
                props: t,
                originalEvent: i
            }),
            !1;
        case "open":
            if (_ = this.get_single_uid())
                return s.href = this.url("show", this.params_from_uid(_, {
                    _extwin: 1
                })),
                !0;
            break;
        case "close":
            this.env.extwin && window.close();
            break;
        case "list":
            t && "" != t && this.reset_qsearch(!0),
            "compose" == this.env.action && this.env.extwin ? window.close() : "mail" == this.task ? (this.list_mailbox(t, t ? 1 : ""),
            this.set_button_titles()) : "addressbook" == this.task && this.list_contacts(t);
            break;
        case "set-listmode":
            this.set_list_options(null, void 0, void 0, "threads" == t ? 1 : 0);
            break;
        case "sort":
            var o = this.env.sort_order
              , l = this.env.disabled_sort_col ? this.env.sort_col : t;
            this.env.disabled_sort_order || (o = this.env.sort_col == l && "ASC" == o ? "DESC" : "ASC"),
            this.set_list_sorting(l, o),
            this.list_mailbox("", "", l + "_" + o);
            break;
        case "nextpage":
            this.list_page("next");
            break;
        case "lastpage":
            this.list_page("last");
            break;
        case "previouspage":
            this.list_page("prev");
            break;
        case "firstpage":
            this.list_page("first");
            break;
        case "expunge":
            this.env.exists && this.expunge_mailbox(this.env.mailbox);
            break;
        case "purge":
        case "empty-mailbox":
            this.env.exists && this.purge_mailbox(this.env.mailbox);
            break;
        case "show":
            "mail" == this.task ? !(_ = this.get_single_uid()) || this.env.uid && _ == this.env.uid || ((o = this.get_message_mailbox(_)) == this.env.drafts_mailbox ? this.open_compose_step({
                _draft_uid: _,
                _mbox: o
            }) : this.show_message(_)) : "addressbook" == this.task ? !(n = t || this.get_single_cid()) || "show" == this.env.action && n == this.env.cid || this.load_contact(n, "show") : "settings" == this.task && this.goto_url("settings/" + t, {
                _framed: 0
            });
            break;
        case "add":
            "addressbook" == this.task ? this.load_contact(0, "add") : "settings" == this.task && "responses" == this.env.action ? this.load_response(0, "add-response") : "settings" == this.task && this.load_identity(0, "add-identity");
            break;
        case "edit":
            "addressbook" == this.task && (n = this.get_single_cid()) ? this.load_contact(n, "edit") : "mail" == this.task && (_ = this.get_single_uid()) && ((a = {
                _mbox: this.get_message_mailbox(_)
            })[a._mbox == this.env.drafts_mailbox && "new" != t ? "_draft_uid" : "_uid"] = _,
            this.open_compose_step(a));
            break;
        case "save":
            if (m = this.gui_objects.editform) {
                if ((r = $("[name='_pagesize']", m)) && r.length && isNaN(parseInt(r.val()))) {
                    this.alert_dialog(this.get_label("nopagesizewarning"), function() {
                        r.focus()
                    });
                    break
                }
                if ("reload" == t)
                    m.action += "&_reload=1";
                else if ("settings" == this.task && this.env.identities_level % 2 == 0 && (r = $("[name='_email']", m)) && r.length && !rcube_check_email(r.val())) {
                    this.alert_dialog(this.get_label("noemailwarning"), function() {
                        r.focus()
                    });
                    break
                }
                parent.rcmail && parent.rcmail.env.source && (m.action = this.add_url(m.action, "_orig_source", parent.rcmail.env.source)),
                m.submit()
            }
            break;
        case "delete":
            "mail" == this.task ? this.delete_messages(i) : "addressbook" == this.task ? this.delete_contacts() : "settings" == this.task && "responses" == this.env.action ? this.delete_response() : "settings" == this.task && this.delete_identity();
            break;
        case "move":
        case "moveto":
            "mail" == this.task ? this.move_messages(t, i) : "addressbook" == this.task && this.move_contacts(t, i);
            break;
        case "copy":
            "mail" == this.task ? this.copy_messages(t, i) : "addressbook" == this.task && this.copy_contacts(t, i);
            break;
        case "mark":
            t && this.mark_message(t);
            break;
        case "toggle_status":
        case "toggle_flag":
            g = "toggle_flag" == e ? "flagged" : "read",
            (_ = t) && ("flagged" == g ? this.message_list.rows[_].flagged && (g = "unflagged") : this.message_list.rows[_].deleted ? g = "undelete" : this.message_list.rows[_].unread || (g = "unread"),
            this.mark_message(g, _));
            break;
        case "add-contact":
            this.add_contact(t);
            break;
        case "load-remote":
            if (this.env.uid) {
                if (t && this.env.sender) {
                    this.add_contact(this.env.sender, !0, t);
                    break
                }
                this.show_message(this.env.uid, !0, "preview" == this.env.action)
            }
            break;
        case "load-attachment":
        case "open-attachment":
        case "download-attachment":
            var c = this.env.attachments[t];
            return ("compose" == this.env.action ? (h = {
                _file: t,
                _id: this.env.compose_id
            },
            c = c ? c.mimetype : "") : h = {
                _mbox: this.env.mailbox,
                _uid: this.env.uid,
                _part: t
            },
            "download-attachment" != e && c && this.env.mimetypes && 0 <= $.inArray(c, this.env.mimetypes) && this.open_window(this.url("get", $.extend({
                _frame: 1,
                _framed: 0
            }, h)))) ? !0 : (h._download = 1,
            this.compose_skip_unsavedcheck = 1,
            this.goto_url("get", h, !1, !0),
            !(this.compose_skip_unsavedcheck = 0));
        case "select-all":
            this.select_all_mode = !t,
            this.dummy_select = !0;
            var h = this["addressbook" == this.task ? "contact_list" : "message_list"];
            "invert" == t ? h.invert_selection() : h.select_all("page" == t ? "" : t),
            this.dummy_select = null;
            break;
        case "select-none":
            this.select_all_mode = !1,
            this["addressbook" == this.task ? "contact_list" : "message_list"].clear_selection();
            break;
        case "expand-all":
            this.env.autoexpand_threads = 1,
            this.message_list.expand_all();
            break;
        case "expand-unread":
            this.env.autoexpand_threads = 2,
            this.message_list.collapse_all(),
            this.expand_unread();
            break;
        case "collapse-all":
            this.env.autoexpand_threads = 0,
            this.message_list.collapse_all();
            break;
        case "nextmessage":
            this.env.next_uid && this.show_message(this.env.next_uid, !1, "preview" == this.env.action);
            break;
        case "lastmessage":
            this.env.last_uid && this.show_message(this.env.last_uid);
            break;
        case "previousmessage":
            this.env.prev_uid && this.show_message(this.env.prev_uid, !1, "preview" == this.env.action);
            break;
        case "firstmessage":
            this.env.first_uid && this.show_message(this.env.first_uid);
            break;
        case "compose":
            if (a = {},
            "mail" == this.task)
                a = {
                    _mbox: this.env.mailbox,
                    _search: this.env.search_request
                },
                t && (a._to = t);
            else if ("addressbook" == this.task)
                if (t && 0 < t.indexOf("@"))
                    a._to = t;
                else {
                    var d = [];
                    if (t ? d.push(t) : this.contact_list && (d = this.contact_list.get_selection()),
                    d.length) {
                        this.http_post("mailto", {
                            _cid: d.join(","),
                            _source: this.env.source
                        }, !0);
                        break
                    }
                    if (this.env.group && this.env.pagecount) {
                        this.http_post("mailto", {
                            _gid: this.env.group,
                            _source: this.env.source
                        }, !0);
                        break
                    }
                }
            else
                t && "string" == typeof t ? a._to = t : t && "object" == typeof t && $.extend(a, t);
            this.open_compose_step(a);
            break;
        case "spellcheck":
            this.spellcheck_state() ? this.editor.spellcheck_stop() : this.editor.spellcheck_start();
            break;
        case "savedraft":
            if (clearTimeout(this.save_timer),
            this.env.draft_id && this.cmp_hash == this.compose_field_hash()) {
                this.auto_save_start();
                break
            }
            this.submit_messageform(!0);
            break;
        case "send":
            if (!t.nocheck && !this.env.is_sent && !this.check_compose_input(e))
                break;
            clearTimeout(this.save_timer),
            this.submit_messageform();
            break;
        case "send-attachment":
            clearTimeout(this.save_timer),
            (g = this.upload_file(t || this.gui_objects.uploadform, "upload")) || (!1 !== g && this.alert_dialog(this.get_label("selectimportfile")),
            aborted = !0);
            break;
        case "insert-sig":
            this.change_identity($("[name='_from']")[0], !0);
            break;
        case "list-addresses":
            this.list_contacts(t),
            this.enable_command("add-recipient", !1);
            break;
        case "add-recipient":
            this.compose_add_recipient(t);
            break;
        case "reply-all":
        case "reply-list":
        case "reply":
            (_ = this.get_single_uid()) && (a = {
                _reply_uid: _,
                _mbox: this.get_message_mailbox(_),
                _search: this.env.search_request
            },
            "reply-all" == e ? a._all = !t && 1 == this.env.reply_all_mode && this.commands["reply-list"] ? "list" : "all" : "reply-list" == e && (a._all = "list"),
            this.open_compose_step(a));
            break;
        case "forward-attachment":
        case "forward-inline":
        case "forward":
            d = this.env.uid ? [this.env.uid] : this.message_list ? this.message_list.get_selection() : [];
            d.length && (a = {
                _forward_uid: this.uids_to_list(d),
                _mbox: this.env.mailbox,
                _search: this.env.search_request
            },
            ("forward-attachment" == e || !t && this.env.forward_attachment || 1 < d.length) && (a._attachment = 1),
            this.open_compose_step(a));
            break;
        case "print":
            "addressbook" == this.task ? (_ = this.get_single_cid()) && (a = "&_action=print&_cid=" + _,
            this.env.source && (a += "&_source=" + urlencode(this.env.source)),
            this.open_window(this.env.comm_path + a, !0, !0)) : "get" != this.env.action || this.env.is_message ? (_ = this.get_single_uid()) && (a = this.url("print", this.params_from_uid(_, {
                _safe: this.env.safemode ? 1 : 0
            })),
            this.open_window(a, !0, !0) && "show" != this.env.action && "get" != this.env.action && this.mark_message("read", _)) : this.gui_objects.messagepartframe.contentWindow.print();
            break;
        case "viewsource":
            (_ = this.get_single_uid()) && this.open_window(this.url("viewsource", this.params_from_uid(_)), !0, !0);
            break;
        case "download":
            "get" == this.env.action ? location.href = this.secure_url(location.href.replace(/_frame=/, "_download=")) : (_ = this.get_single_uid()) && this.goto_url("viewsource", this.params_from_uid(_, {
                _save: 1
            }), !1, !0);
            break;
        case "search":
            return this.qsearch(t);
        case "reset-search":
            var _ = this.env.search_request || this.env.qsearch;
            this.reset_qsearch(!0),
            _ && "compose" == this.env.action ? this.contact_list && this.list_contacts_clear() : _ && this.env.mailbox ? this.list_mailbox(this.env.mailbox, 1) : _ && "addressbook" == this.task && (this.env.source = this.env.last_source || "",
            this.env.group = this.env.last_group || "",
            this.list_contacts(this.env.source, this.env.group, 1));
            break;
        case "pushgroup":
            var u = {
                id: t.id,
                search_request: this.env.search_request,
                page: this.env.current_page,
                search: this.env.search_request && this.gui_objects.qsearchbox ? this.gui_objects.qsearchbox.value : null
            };
            this.env.address_group_stack.push(u),
            s && i && rcube_event.cancel(i);
        case "listgroup":
            this.reset_qsearch(),
            this.list_contacts(t.source, t.id, 1, u);
            break;
        case "popgroup":
            this.env.address_group_stack.length && (p = this.env.address_group_stack.pop(),
            this.reset_qsearch(),
            p.search_request ? (p.search && this.gui_objects.qsearchbox && $(this.gui_objects.qsearchbox).val(p.search),
            this.env.search_request = p.search_request,
            this.list_contacts_remote(null, null, this.env.current_page = p.page)) : this.list_contacts(t.source, this.env.address_group_stack[this.env.address_group_stack.length - 1].id));
            break;
        case "import-messages":
            var m = t || this.gui_objects.importform
              , p = this.set_busy(!0, "importwait");
            (g = this.upload_file(m, "import", p)) || (this.set_busy(!1, null, p),
            !1 !== g && this.alert_dialog(this.get_label("selectimportfile")),
            this.command_aborted = !0);
            break;
        case "import":
            var f = $("<iframe>").attr("src", this.url("import", {
                _framed: 1,
                _target: this.env.source
            }));
            this.import_state = null,
            this.import_dialog = this.simple_dialog(f, "importcontacts", function(e) {
                var t, s = f[0].contentWindow, i = null;
                (i = s.rcmail.gui_objects.importformmap || s.rcmail.gui_objects.importform) && (!(t = s.$("#rcmimportfile")[0]) || t.value ? (t = s.rcmail.set_busy(!0, "importwait"),
                $('[name="_unlock"]', i).val(t),
                i.submit(),
                s.rcmail.lock_form(i, !0),
                $(e.target).attr("disabled", !0).next().focus()) : s.rcmail.alert_dialog(s.rcmail.get_label("selectimportfile")))
            }, {
                close: function(e, t) {
                    $(this).remove(),
                    "reload" == ref.import_state && ref.command("list")
                },
                button: "import",
                width: 500,
                height: 300
            });
            break;
        case "export":
            0 < this.contact_list.rowcount && this.goto_url("export", {
                _source: this.env.source,
                _gid: this.env.group,
                _search: this.env.search_request
            }, !1, !0);
            break;
        case "export-selected":
            0 < this.contact_list.rowcount && this.goto_url("export", {
                _source: this.env.source,
                _gid: this.env.group,
                _cid: this.contact_list.get_selection().join(",")
            }, !1, !0);
            break;
        case "upload-photo":
            this.upload_contact_photo(t || this.gui_objects.uploadform);
            break;
        case "delete-photo":
            this.replace_contact_photo("-del-");
            break;
        case "undo":
            this.http_request("undo", "", this.display_message("", "loading"));
            break;
        default:
            var g = e.replace(/-/g, "_");
            if (this[g] && "function" == typeof this[g])
                return this[g](t, s, i)
        }
    }
    ,
    this.enable_command = function() {
        for (var e, t, s = Array.prototype.slice.call(arguments), i = s.pop(), n = 0; n < s.length; n++)
            if ("string" == typeof (t = s[n]))
                this.commands[t] = i,
                this.set_button(t, i ? "act" : "pas"),
                this.triggerEvent("enable-command", {
                    command: t,
                    status: i
                });
            else
                for (e in t)
                    s.push(t[e]);
        this.set_menu_buttons()
    }
    ,
    this.command_enabled = function(e) {
        return this.commands[e]
    }
    ,
    this.set_busy = function(e, t, s) {
        var i;
        return e && t ? (i = this.get_label(t),
        s = this.display_message(i = i == t ? "Loading..." : i, "loading")) : !e && s && this.hide_message(s),
        this.busy = e,
        this.gui_objects.editform && this.lock_form(this.gui_objects.editform, e),
        s
    }
    ,
    this.get_label = function(e, t) {
        return t && this.labels[t + "." + e] ? this.labels[t + "." + e] : this.labels[e] || e
    }
    ,
    this.gettext = this.get_label,
    this.switch_task = function(e) {
        var t, s;
        2 == (s = e.split("/")).length && (e = s[0],
        t = s[1]),
        this.task === e && "mail" != e || (s = this.get_task_url(e),
        t && (s += "&_action=" + t),
        "mail" == e ? s += "&_mbox=INBOX" : "logout" == e && (s = this.secure_url(s),
        this.clear_compose_data()),
        this.redirect(s))
    }
    ,
    this.get_task_url = function(e, t) {
        return (t = t || this.env.comm_path).match(/[?&]_task=[a-zA-Z0-9_-]+/) ? t.replace(/_task=[a-zA-Z0-9_-]+/, "_task=" + e) : t.replace(/\?.*$/, "") + "?_task=" + e
    }
    ,
    this.reload = function(e) {
        this.is_framed() ? parent.rcmail.reload(e) : e ? setTimeout(function() {
            ref.reload()
        }, e) : window.location && (location.href = this.url("", {
            _extwin: this.env.extwin
        }))
    }
    ,
    this.add_url = function(e, t, s) {
        var i, n, a = "";
        return s = urlencode(s),
        /(#[a-z0-9_-]*)$/.test(e) && (a = RegExp.$1,
        e = e.substr(0, e.length - a.length)),
        /(\?.*)$/.test(e) ? (i = RegExp.$1,
        (n = RegExp("((\\?|&)" + RegExp.escape(t) + "=[^&]*)")).test(i) ? i = i.replace(n, RegExp.$2 + t + "=" + s) : i += "&" + t + "=" + s,
        e.replace(/(\?.*)$/, i) + a) : e + "?" + t + "=" + s + a
    }
    ,
    this.secure_url = function(e) {
        return this.add_url(e, "_token", this.env.request_token)
    }
    ,
    this.is_framed = function() {
        return this.env.framed && parent.rcmail && parent.rcmail != this && "function" == typeof parent.rcmail.command
    }
    ,
    this.save_pref = function(e) {
        var t = {
            _name: e.name,
            _value: e.value
        };
        e.session && (t._session = e.session),
        e.env && (this.env[e.env] = e.value),
        this.http_post("save-pref", t)
    }
    ,
    this.html_identifier = function(e, t) {
        return t ? this.html_identifier_encode(e) : String(e).replace(this.identifier_expr, "_")
    }
    ,
    this.html_identifier_encode = function(e) {
        return Base64.encode(String(e)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_")
    }
    ,
    this.html_identifier_decode = function(e) {
        for (e = String(e).replace(/-/g, "+").replace(/_/g, "/"); e.length % 4; )
            e += "=";
        return Base64.decode(e)
    }
    ,
    this.drag_menu = function(e, t) {
        var s = rcube_event.get_modifier(e)
          , i = this.gui_objects.dragmenu;
        if (i && s == SHIFT_KEY && this.commands.copy) {
            s = rcube_event.get_mouse_pos(e);
            return this.env.drag_target = t,
            this.show_menu(this.gui_objects.dragmenu.id, !0, e),
            $(i).css({
                top: s.y - 10 + "px",
                left: s.x - 10 + "px"
            }),
            !0
        }
        return !1
    }
    ,
    this.drag_menu_action = function(e) {
        var t = this.gui_objects.dragmenu;
        t && $(t).hide(),
        this.command(e, this.env.drag_target),
        this.env.drag_target = null
    }
    ,
    this.drag_start = function(e) {
        this.drag_active = !0,
        this.preview_timer && clearTimeout(this.preview_timer),
        this.treelist && this.treelist.drag_start()
    }
    ,
    this.drag_end = function(e) {
        var t, s;
        this.treelist && this.treelist.drag_end(),
        (t = this.message_list) ? s = this.env.mailboxes : (t = this.contact_list) && (s = this.env.contactfolders),
        this.drag_active && s && this.env.last_folder_target && !rcube_event.is_keyboard(e) && (s = s[this.env.last_folder_target],
        t.draglayer.hide(),
        this.contact_list ? this.contacts_drag_menu(e, s) || this.command("move", s) : this.drag_menu(e, s) || this.command("move", s)),
        this.drag_active = !1,
        this.env.last_folder_target = null
    }
    ,
    this.drag_move = function(e) {
        var t, s, i;
        this.gui_objects.folderlist && (i = "draglayernormal",
        e = rcube_event.get_mouse_pos(e),
        this.contact_list && this.contact_list.draglayer && (s = this.contact_list.draglayer.attr("class")),
        this.treelist && (t = this.treelist.intersects(e, !0)) ? (this.env.last_folder_target = t,
        i = "draglayer" + (1 < this.check_droptarget(t) ? "copy" : "normal")) : this.env.last_folder_target = null,
        i != s && this.contact_list && this.contact_list.draglayer && this.contact_list.draglayer.attr("class", i))
    }
    ,
    this.collapse_folder = function(e) {
        this.treelist && this.treelist.toggle(e)
    }
    ,
    this.folder_collapsed = function(e) {
        this.folder_collapsed_timer && clearTimeout(this.folder_collapsed_timer);
        var t, s = "addressbook" == this.env.task ? "collapsed_abooks" : "collapsed_folders", i = this.env[s];
        e.collapsed ? (this.env[s] = this.env[s] + "&" + urlencode(e.id) + "&",
        !e.virtual && this.env.mailbox && this.env.mailbox.startsWith(e.id + this.env.delimiter) && this.command("list", e.id)) : (t = new RegExp("&" + urlencode(e.id) + "&"),
        this.env[s] = this.env[s].replace(t, "")),
        this.drag_active || (i !== this.env[s] && (this.folder_collapsed_timer = setTimeout(function() {
            ref.command("save-pref", {
                name: s,
                value: ref.env[s]
            })
        }, 10)),
        this.env.unread_counts && this.set_unread_count_display(e.id, !1))
    }
    ,
    this.doc_mouse_up = function(s) {
        var e, r = rcube_event.get_target(s);
        if (!$(r).closest(".ui-dialog, .ui-widget-overlay").length) {
            if (window.rcube_list_widget && rcube_list_widget._instances.length && $.each(rcube_list_widget._instances, function(e, t) {
                t && !rcube_mouse_is_over(s, t.list.parentNode) && t.blur()
            }),
            this.buttons_sel) {
                for (e in this.buttons_sel)
                    "function" != typeof e && this.button_out(this.buttons_sel[e], e);
                this.buttons_sel = {}
            }
            setTimeout(function(e) {
                for (var t, s, i, n = $(r).parents(), a = ref.menu_stack.length - 1; 0 <= a; a--)
                    i = ref.menu_stack[a],
                    !(t = $("#" + i)).is(":visible") || r == t.data("opener") || r == t.get(0) || n.is(t.data("opener")) || i == s || "true" == t.attr("data-editable") && $(r).parents("#" + i).length || "true" == t.attr("data-sticky") && rcube_mouse_is_over(e, t.get(0)) || ref.hide_menu(i, e),
                    s = t.data("parent")
            }, 10, s)
        }
    }
    ,
    this.doc_keypress = function(e) {
        function t(e) {
            var t, s = e < 0 ? "prevAll" : "nextAll", i = e < 0 ? "last" : "first";
            return ref.focused_menu && (t = $("#" + ref.focused_menu)) ? (e = !(e = t.find(":focus").closest("li")[s]().has(":not([aria-disabled=true])").find("a,input")[i]()).length ? t.find(":focus").closest("ul")[s]().has(":not([aria-disabled=true])").find("a,input")[i]() : e).focus().length : 0
        }
        var s = e.target || {}
          , i = rcube_event.get_keycode(e);
        if (27 != e.keyCode && (!this.menu_keyboard_active || "TEXTAREA" == s.nodeName || "SELECT" == s.nodeName))
            return !0;
        switch (i) {
        case 38:
        case 40:
        case 63232:
        case 63233:
            return t(38 == i || 63232 == i ? -1 : 1),
            rcube_event.cancel(e);
        case 9:
            return this.focused_menu && (t(rcube_event.get_modifier(e) == SHIFT_KEY ? -1 : 1) || this.hide_menu(this.focused_menu, e)),
            rcube_event.cancel(e);
        case 27:
            this.menu_stack.length && this.hide_menu(this.menu_stack[this.menu_stack.length - 1], e)
        }
        return !0
    }
    ,
    this.list_keypress = function(e, t) {
        e.modkey != CONTROL_KEY && (e.key_pressed == e.DELETE_KEY || e.key_pressed == e.BACKSPACE_KEY ? this.command(t && t.del ? t.del : "delete") : 33 == e.key_pressed ? this.command(t && t.prev ? t.prev : "previouspage") : 34 == e.key_pressed && this.command(t && t.next ? t.next : "nextpage"))
    }
    ,
    this.msglist_keypress = function(e) {
        e.key_pressed != e.ENTER_KEY || this.env.contentframe ? this.list_keypress(e) : this.command("show")
    }
    ,
    this.msglist_select = function(e) {
        this.preview_timer && clearTimeout(this.preview_timer);
        var s = !1
          , t = e.get_single_selection()
          , i = e.get_selection(!1)
          , n = i.length;
        this.enable_command(this.env.message_commands, null != t),
        0 < n && (this.env.multifolder_listing ? $.each(i, function(e, t) {
            if (ref.get_message_mailbox(t) == ref.env.drafts_mailbox)
                return !(s = !0)
        }) : s = this.env.mailbox == this.env.drafts_mailbox),
        t && (s ? this.enable_command("reply", "reply-all", "reply-list", "forward", "forward-inline", "forward-attachment", "bounce", !1) : this.env.messages[t].ml || this.enable_command("reply-list", !1)),
        this.enable_command("delete", "move", "copy", "mark", 0 < n),
        this.enable_command("forward", "forward-attachment", !s && 0 < n),
        (t || n && n != e.rowcount) && (this.select_all_mode = !1),
        t && this.env.contentframe && !e.multi_selecting && !this.dummy_select ? (t = (n = (new Date).getTime()) - (this._last_msglist_select_time || 0),
        e = this.preview_delay_click,
        t < this.preview_delay_select && (e = this.preview_delay_select,
        this.preview_timer && clearTimeout(this.preview_timer),
        this.env.contentframe && this.show_contentframe(!1)),
        this._last_msglist_select_time = n,
        this.preview_timer = setTimeout(function() {
            ref.msglist_get_preview()
        }, e)) : this.env.contentframe && this.show_contentframe(!1)
    }
    ,
    this.msglist_dbl_click = function(e) {
        this.preview_timer && clearTimeout(this.preview_timer);
        var t = e.get_single_selection();
        t && ((e = this.get_message_mailbox(t)) == this.env.drafts_mailbox ? this.open_compose_step({
            _draft_uid: t,
            _mbox: e
        }) : this.show_message(t))
    }
    ,
    this.msglist_get_preview = function() {
        var e = this.get_single_uid();
        e && this.env.contentframe && !this.drag_active ? this.show_message(e, !1, !0) : this.env.contentframe && this.show_contentframe(!1)
    }
    ,
    this.msglist_expand = function(e) {
        this.env.messages[e.uid] && (this.env.messages[e.uid].expanded = e.expanded),
        $(e.obj)[e.expanded ? "addClass" : "removeClass"]("expanded")
    }
    ,
    this.msglist_set_coltypes = function(e) {
        var t, s, i = e.thead.rows[0].cells;
        for (this.env.listcols = [],
        t = 0; t < i.length; t++)
            i[t].id && i[t].id.startsWith("rcm") && (s = i[t].id.slice(3),
            this.env.listcols.push(s));
        this.msglist_setup(this.env.layout),
        0 <= (e = $.inArray("flag", this.env.listcols)) && (this.env.flagged_col = e),
        0 <= (e = $.inArray("subject", this.env.listcols)) && (this.env.subject_col = e),
        this.command("save-pref", {
            name: "list_cols",
            value: this.env.listcols,
            session: "list_attrib/columns"
        })
    }
    ,
    this.msglist_setup = function(e) {
        (t = this.triggerEvent("msglist_layout", e)) && (e = t),
        t = this.env["widescreen" == e ? "listcols_widescreen" : "listcols"],
        "widescreen" != e || this.env.threading || (t = $.grep(t, function(e) {
            return "threads" != e
        })),
        this.env.msglist_layout = e,
        this.env.msglist_cols = t;
        var e = this.gui_objects.messagelist
          , t = e.className.split(" ").filter(function(e) {
            return !e.startsWith("sort-")
        });
        t.push("sort-" + (this.env.sort_col || "none")),
        e.className = t.join(" ")
    }
    ,
    this.check_droptarget = function(e) {
        switch (this.task) {
        case "mail":
            return !this.env.mailboxes[e] || this.env.mailboxes[e].virtual || this.env.mailboxes[e].id == this.env.mailbox && !this.is_multifolder_listing() ? 0 : 1;
        case "addressbook":
            var t;
            if (e != this.env.source && (t = this.env.contactfolders[e]))
                if ("group" == t.type) {
                    if (t.id != this.env.group && !this.env.contactfolders[t.source].readonly)
                        return !(1 < this.env.selection_sources.length || -1 == $.inArray(t.source, this.env.selection_sources)) || this.commands.move ? 1 : 2
                } else if (!t.readonly && (1 < this.env.selection_sources.length || -1 == $.inArray(e, this.env.selection_sources)))
                    return this.commands.move ? 1 : 2
        }
        return 0
    }
    ,
    this.open_window = function(e, t, s) {
        var i, n, a, r, o = "rcmextwin" + (new Date).getTime();
        if (e += (e.match(/\?/) ? "&" : "?") + "_extwin=1",
        (r = this.env.standard_windows ? window.open(e, o) : (a = this.is_framed() ? parent.window : window,
        n = (i = $(a)).width(),
        i = (bw.mz ? $("body", a) : i).height(),
        t = Math.min(t ? this.env.popup_width_small : this.env.popup_width, n),
        n = (a.screenLeft || a.screenX) + 20,
        a = (a.screenTop || a.screenY) + 20,
        window.open(e, o, "width=" + t + ",height=" + i + ",top=" + a + ",left=" + n + ",resizable=yes,location=no,scrollbars=yes" + (s ? ",toolbar=yes,menubar=yes,status=yes" : ",toolbar=no,menubar=no,status=no")))) && !r.closed)
            return !e && r.document && r.document.write("<html><body>" + this.get_label("loading") + "</body></html>"),
            this.triggerEvent("openwindow", {
                url: e,
                handle: r
            }),
            setTimeout(function() {
                r && r.focus()
            }, 10),
            r;
        this.display_message("windowopenerror", "warning")
    }
    ,
    this.init_message_row = function(s) {
        var e = {}
          , t = s.uid
          , i = (null != this.env.status_col ? "status" : "msg") + "icn" + s.id;
        t && this.env.messages[t] && $.extend(s, this.env.messages[t]),
        (s.icon = document.getElementById(i)) && (e.icon = function(e) {
            ref.command("toggle_status", t)
        }
        ),
        null != this.env.status_col ? s.msgicon = document.getElementById("msgicn" + s.id) : s.msgicon = s.icon,
        null != this.env.flagged_col && (s.flagicon = document.getElementById("flagicn" + s.id)) && (e.flagicon = function(e) {
            ref.command("toggle_flag", t)
        }
        ),
        !s.depth && s.has_children && (s.expando = document.getElementById("rcmexpando" + s.id)) && (e.expando = function(e) {
            ref.expand_message_row(e, t)
        }
        ),
        $.each(e, function(e, t) {
            s[e].onclick = function(e) {
                return t(e),
                rcube_event.cancel(e)
            }
            ,
            bw.touch && s[e].addEventListener && s[e].addEventListener("touchend", function(e) {
                if (1 == e.changedTouches.length)
                    return t(e),
                    rcube_event.cancel(e)
            }, !1)
        }),
        this.triggerEvent("insertrow", {
            uid: t,
            row: s
        })
    }
    ,
    this.add_message_row = function(e, t, s, i) {
        if (!this.gui_objects.messagelist || !this.message_list)
            return !1;
        if (s.mbox != this.env.mailbox && !s.skip_mbox_check)
            return !1;
        if (this.message_list.rows[e])
            return !1;
        this.env.messages[e] || (this.env.messages[e] = {}),
        $.extend(this.env.messages[e], {
            deleted: s.deleted ? 1 : 0,
            replied: s.answered ? 1 : 0,
            unread: s.seen ? 0 : 1,
            forwarded: s.forwarded ? 1 : 0,
            flagged: s.flagged ? 1 : 0,
            has_children: s.has_children ? 1 : 0,
            depth: s.depth || 0,
            unread_children: s.unread_children || 0,
            flagged_children: s.flagged_children || 0,
            parent_uid: s.parent_uid || 0,
            selected: this.select_all_mode || this.message_list.in_selection(e),
            ml: s.ml ? 1 : 0,
            ctype: s.ctype,
            mbox: s.mbox,
            flags: s.extra_flags
        });
        var n, a, r, o, l, c = "", h = "", d = "", _ = "", u = this.message_list, m = u.rows, p = this.env.messages[e], f = this.html_identifier(e, !0), g = "message" + (s.seen ? "" : " unread") + (s.deleted ? " deleted" : "") + (s.flagged ? " flagged" : "") + (p.selected ? " selected" : ""), v = {
            cols: [],
            style: {},
            id: "rcmrow" + f,
            uid: e
        }, b = this.env.msglist_layout, y = this.env.msglist_cols;
        for (n in "widescreen" == b ? this.env.status_col = null : 0 <= (n = $.inArray("status", y)) && (this.env.status_col = n),
        o = "msgicon",
        null === this.env.status_col && (o += " status",
        s.deleted ? (c += " deleted",
        h += this.get_label("deleted") + " ") : s.seen ? 0 < s.unread_children && (c += " unreadchildren") : (c += " unread",
        h += this.get_label("unread") + " ")),
        s.answered && (c += " replied",
        h += this.get_label("replied") + " "),
        s.forwarded && (c += " forwarded",
        h += this.get_label("forwarded") + " "),
        p.selected && !u.in_selection(e) && u.selection.push(e),
        this.env.threading && (p.depth ? (d += '<span id="rcmtab' + f + '" class="branch" style="width:' + 15 * p.depth + 'px;">&nbsp;&nbsp;</span>',
        m[p.parent_uid] && !1 === m[p.parent_uid].expanded || !(0 != this.env.autoexpand_threads && 2 != this.env.autoexpand_threads || m[p.parent_uid] && m[p.parent_uid].expanded) ? (v.style.display = "none",
        p.expanded = !1) : p.expanded = !0,
        g += " thread expanded") : p.has_children && (void 0 === p.expanded && (1 == this.env.autoexpand_threads || 2 == this.env.autoexpand_threads && p.unread_children) && (p.expanded = !0),
        _ = '<div id="rcmexpando' + v.id + '" class="' + (p.expanded ? "expanded" : "collapsed") + '">&nbsp;&nbsp;</div>',
        g += " thread" + (p.expanded ? " expanded" : "")),
        s.unread_children && s.seen && !p.expanded && (g += " unroot"),
        s.flagged_children && !p.expanded && (g += " flaggedroot")),
        d += '<span id="msgicn' + v.id + '" class="' + o + c + '" title="' + h + '"></span>',
        v.className = g,
        t.subject && (m = s.mbox == this.env.drafts_mailbox ? "compose" : "show",
        h = s.mbox == this.env.drafts_mailbox ? "_draft_uid" : "_uid",
        (g = {
            _mbox: s.mbox
        })[h] = e,
        t.subject = '<a href="' + this.url(m, g) + '" onclick="return rcube_event.keyboard_only(event)" onmouseover="rcube_webmail.long_subject_title(this,' + (p.depth + 1) + ')" tabindex="-1"><span>' + t.subject + "</span></a>"),
        y)
            r = y[n],
            a = {
                className: String(r).toLowerCase(),
                events: {}
            },
            this.env.coltypes[r] && this.env.coltypes[r].hidden && (a.className += " hidden"),
            r = "flag" == r ? (o = s.flagged ? "flagged" : "unflagged",
            l = this.get_label(o),
            '<span id="flagicn' + v.id + '" class="' + o + '" title="' + l + '"></span>') : "attachment" == r ? (l = this.get_label("withattachment"),
            s.attachmentClass ? '<span class="' + s.attachmentClass + '" title="' + l + '"></span>' : "multipart/report" == s.ctype ? '<span class="report"></span>' : "multipart/encrypted" == s.ctype || "application/pkcs7-mime" == s.ctype ? '<span class="encrypted"></span>' : s.hasattachment || !s.hasnoattachment && /application\/|multipart\/(m|signed)/.test(s.ctype) ? '<span class="attachment" title="' + l + '"></span>' : "&nbsp;") : "status" == r ? (l = "",
            s.deleted ? l = this.get_label(o = "deleted") : s.seen ? o = 0 < s.unread_children ? "unreadchildren" : "msgicon" : l = this.get_label(o = "unread"),
            '<span id="statusicn' + v.id + '" class="' + o + c + '" title="' + l + '"></span>') : "threads" == r ? _ : "subject" == r ? d + t[r] : "priority" == r ? 0 < s.prio && s.prio < 6 ? (l = this.get_label("priority") + " " + s.prio,
            '<span class="prio' + s.prio + '" title="' + l + '"></span>') : "&nbsp;" : "folder" == r ? '<span onmouseover="rcube_webmail.long_subject_title(this)">' + t[r] + "<span>" : t[r],
            a.innerHTML = r,
            v.cols.push(a);
        "widescreen" == b && (v = this.widescreen_message_row(v, e, p)),
        u.insert_row(v, i),
        i && this.env.pagesize && u.rowcount > this.env.pagesize && (e = u.get_last_row(),
        u.remove_row(e),
        u.clear_selection(e))
    }
    ,
    this.widescreen_message_row = function(a, e, t) {
        var r = document.createElement("tr");
        return r.id = a.id,
        r.uid = a.uid,
        r.className = a.className,
        a.style && $.extend(r.style, a.style),
        $.each(this.env.widescreen_list_template, function() {
            if (ref.env.threading || "threads" != this.className) {
                var e, t, s, i, n = document.createElement("td");
                for (this.className && (n.className = this.className),
                e = 0; this.cells && e < this.cells.length; e++)
                    for (t = 0; a.cols && t < a.cols.length; t++)
                        if (this.cells[e] == a.cols[t].className) {
                            s = a.cols[t],
                            (i = document.createElement("span")).className = this.cells[e],
                            "subject" == this.className && "subject" != i.className && (i.className += " skip-on-drag"),
                            s.innerHTML && (i.innerHTML = s.innerHTML),
                            n.appendChild(i);
                            break
                        }
                r.appendChild(n)
            }
        }),
        this.env.threading && t.depth && (n = this.calculate_thread_padding(t.depth),
        $("td.subject", r).attr("style", "padding-left:" + n + " !important"),
        $("span.branch", r).remove()),
        r
    }
    ,
    this.calculate_thread_padding = function(e) {
        return ref.env.thread_padding.match(/^([0-9.]+)(.+)/),
        Math.min(6, e) * parseFloat(RegExp.$1) + RegExp.$2
    }
    ,
    this.set_list_sorting = function(e, t) {
        var s = "arrival" == this.env.sort_col ? "date" : this.env.sort_col
          , i = "arrival" == e ? "date" : e;
        $("#rcm" + s).removeClass("sorted" + this.env.sort_order.toUpperCase()),
        i && $("#rcm" + i).addClass("sorted" + t),
        $("#rcmdate > a").prop("rel", "arrival" == e ? "arrival" : "date"),
        this.env.sort_col = e,
        this.env.sort_order = t
    }
    ,
    this.set_list_options = function(e, t, s, i, n) {
        var a, r = {};
        if (void 0 === t && (t = this.env.sort_col),
        s = s || this.env.sort_order,
        this.env.sort_col == t && this.env.sort_order == s || (a = 1,
        this.set_list_sorting(t, s)),
        this.env.threading != i && (a = 1,
        r._threads = i),
        n && this.env.layout != n && (this.triggerEvent("layout-change", {
            old_layout: this.env.layout,
            new_layout: n
        }),
        a = 1,
        this.env.layout = r._layout = n,
        this.msglist_setup(this.env.layout)),
        e && e.length) {
            for (var o, l, c = [], h = this.env.listcols, d = 0; d < h.length; d++)
                l = h[d],
                -1 != (o = $.inArray(l, e)) && (c.push(l),
                delete e[o]);
            for (d = 0; d < e.length; d++)
                e[d] && c.push(e[d]);
            c.join() != h.join() && (a = 1,
            r._cols = c.join(","))
        }
        a && this.list_mailbox("", "", t + "_" + s, r)
    }
    ,
    this.show_message = function(e, t, s) {
        var i, n, a;
        e && (n = window,
        a = this.params_from_uid(e, {
            _caps: this.browser_capabilities()
        }),
        s && (i = this.get_frame_window(this.env.contentframe)) && (n = i,
        a._framed = 1),
        t && (a._safe = 1),
        this.env.search_request && (a._search = this.env.search_request),
        this.env.extwin && (a._extwin = 1),
        a = this.url(s ? "preview" : "show", a),
        s && (this.preview_id = e),
        s && 0 <= String(n.location.href).indexOf(a) ? this.show_contentframe(!0) : s || !this.env.message_extwin || this.env.extwin ? (t && document.referrer && window.history.replaceState && window.history.replaceState({}, "", document.referrer),
        this.location_href(a, n, !0)) : this.open_window(a, !0))
    }
    ,
    this.set_unread_message = function(e, t) {
        var s = this;
        (s = !(s = !s.message_list ? s.opener() : s) && window.parent ? parent.rcmail : s) && s.message_list && (!1 === s.set_message(e, "unread", !1) && s.set_message(e + "-" + t, "unread", !1),
        0 < s.env.unread_counts[t] && (--s.env.unread_counts[t],
        s.set_unread_count(t, s.env.unread_counts[t], "INBOX" == t && !s.is_multifolder_listing())))
    }
    ,
    this.show_contentframe = function(e) {
        var t, s, i = this.env.contentframe;
        (t = this.get_frame_element(i)) && (!e && (s = this.get_frame_window(i)) ? s.location.href.indexOf(this.env.blankpage) < 0 && (s.stop ? s.stop() : s.document.execCommand("Stop"),
        s.location.href = this.env.blankpage) : bw.safari || bw.konq || $(t)[e ? "show" : "hide"]()),
        e || (this.unlock_frame(),
        delete this.preview_id)
    }
    ,
    this.get_frame_element = function(e) {
        var t;
        if (e && (t = document.getElementById(e)))
            return t
    }
    ,
    this.get_frame_window = function(e) {
        e = this.get_frame_element(e);
        if (e && e.name && window.frames)
            return window.frames[e.name]
    }
    ,
    this.lock_frame = function(e) {
        var t = this.is_framed() ? parent.rcmail : this;
        t.env.frame_lock || (t.env.frame_lock = t.set_busy(!0, "loading"));
        try {
            e.frameElement && $(e.frameElement).on("load.lock", function(e) {
                t.unlock_frame(),
                $(this).off("load.lock")
            })
        } catch (e) {}
    }
    ,
    this.unlock_frame = function() {
        this.env.frame_lock && (this.set_busy(!1, null, this.env.frame_lock),
        this.env.frame_lock = null)
    }
    ,
    this.list_page = function(e) {
        "next" == e ? e = this.env.current_page + 1 : "last" == e ? e = this.env.pagecount : "prev" == e && 1 < this.env.current_page ? e = this.env.current_page - 1 : "first" == e && 1 < this.env.current_page && (e = 1),
        0 < e && e <= this.env.pagecount && (this.env.current_page = e,
        "addressbook" == this.task || this.contact_list ? this.list_contacts(this.env.source, this.env.group, e) : "mail" == this.task && this.list_mailbox(this.env.mailbox, e))
    }
    ,
    this.checkmail = function() {
        var e = this.set_busy(!0, "checkingmail")
          , t = this.check_recent_params();
        this.http_post("check-recent", t, e)
    }
    ,
    this.filter_mailbox = function(e) {
        var t, s;
        this.filter_disabled || (t = this.search_params(!1, e),
        s = this.set_busy(!0, "searching"),
        this.clear_message_list(),
        this.env.current_page = 1,
        this.env.search_filter = e,
        this.http_request("search", t, s),
        this.update_state({
            _mbox: t._mbox,
            _filter: e,
            _scope: t._scope
        }))
    }
    ,
    this.refresh_list = function() {
        this.list_mailbox(this.env.mailbox, this.env.current_page || 1, null, {
            _clear: 1
        }, !0),
        this.message_list && this.message_list.clear_selection()
    }
    ,
    this.list_mailbox = function(e, t, s, i, n) {
        var a = window;
        "object" != typeof i && (i = {}),
        e = e || (this.env.mailbox || "INBOX"),
        s && (i._sort = s),
        this.env.mailbox != e ? (this.env.current_page = t = 1,
        this.env.search_scope = "base",
        this.select_all_mode = !1,
        this.reset_search_filter()) : this.env.search_request && (i._search = this.env.search_request),
        n || (this.clear_message_list(),
        e == this.env.mailbox && (e != this.env.mailbox || t || s) || (i._refresh = 1),
        this.select_folder(e, "", !0),
        this.unmark_folder(e, "recent", "", !0),
        this.env.mailbox = e),
        this.gui_objects.messagelist ? this.list_mailbox_remote(e, t, i) : ((s = this.get_frame_window(this.env.contentframe)) && (a = s,
        i._framed = 1),
        this.env.uid && (i._uid = this.env.uid),
        t && (i._page = t),
        e && (i._mbox = e,
        this.set_busy(!0, "loading"),
        this.location_href(i, a)))
    }
    ,
    this.clear_message_list = function() {
        this.env.messages = {},
        this.show_contentframe(!1),
        this.message_list && this.message_list.clear(!0)
    }
    ,
    this.list_mailbox_remote = function(e, t, s) {
        var i = this.set_busy(!0, "loading");
        (s = "object" != typeof s ? {} : s)._layout = this.env.layout,
        s._mbox = e,
        s._page = t,
        this.http_request("list", s, i),
        this.update_state({
            _mbox: e,
            _page: t && 1 < t ? t : null
        })
    }
    ,
    this.update_selection = function() {
        var e, t = this.message_list, s = t.selection, i = t.rows, n = [];
        for (e in s)
            i[s[e]] && n.push(s[e]);
        t.selection = n;
        try {
            var a = this.get_frame_window(this.env.contentframe).rcmail.env.uid;
            a && !t.in_selection(a) && this.show_contentframe(!1)
        } catch (e) {}
    }
    ,
    this.expand_unread = function() {
        for (var e, t = this.message_list.tbody.firstChild; t; )
            1 == t.nodeType && (e = this.message_list.rows[t.uid]) && e.unread_children && (this.message_list.expand_all(e),
            this.set_unread_children(e.uid)),
            t = t.nextSibling;
        return !1
    }
    ,
    this.expand_message_row = function(e, t) {
        var s = this.message_list.rows[t];
        s.expanded = !s.expanded,
        this.set_unread_children(t),
        this.set_flagged_children(t),
        s.expanded = !s.expanded,
        this.message_list.expand_row(e, t)
    }
    ,
    this.expand_threads = function() {
        if (this.env.threading && this.env.autoexpand_threads && this.message_list)
            switch (this.env.autoexpand_threads) {
            case 2:
                this.expand_unread();
                break;
            case 1:
                this.message_list.expand_all()
            }
    }
    ,
    this.init_threads = function(e, t) {
        if (t && t != this.env.mailbox)
            return !1;
        for (var s = 0, i = e.length; s < i; s++)
            this.add_tree_icons(e[s]);
        this.expand_threads()
    }
    ,
    this.add_tree_icons = function(e) {
        for (var t, s, i, n, a = [], r = [], o = this.message_list.rows, l = e ? o[e] ? o[e].obj : null : this.message_list.tbody.firstChild; l; ) {
            if (1 == l.nodeType && (s = o[l.uid]))
                if (s.depth) {
                    for (t = a.length - 1; 0 <= t && ((i = a[t].length) > s.depth ? (n = i - s.depth,
                    2 & a[t][n] || (a[t][n] = a[t][n] ? a[t][n] + 2 : 2)) : i == s.depth && (2 & a[t][0] || (a[t][0] += 2)),
                    !(s.depth > i)); t--)
                        ;
                    a.push(new Array(s.depth)),
                    a[a.length - 1][0] = 1,
                    r.push(s.uid)
                } else {
                    if (a.length) {
                        for (t in a)
                            this.set_tree_icons(r[t], a[t]);
                        a = [],
                        r = []
                    }
                    if (e && l != o[e].obj)
                        break
                }
            l = l.nextSibling
        }
        if (a.length)
            for (t in a)
                this.set_tree_icons(r[t], a[t])
    }
    ,
    this.set_tree_icons = function(e, t) {
        for (var s = [], i = "", n = t.length, a = 0; a < n; a++)
            2 < t[a] ? s.push({
                class: "l3",
                width: 15
            }) : 1 < t[a] ? s.push({
                class: "l2",
                width: 15
            }) : 0 < t[a] ? s.push({
                class: "l1",
                width: 15
            }) : s.length && !s[s.length - 1].class ? s[s.length - 1].width += 15 : s.push({
                class: null,
                width: 15
            });
        for (a = s.length - 1; 0 <= a; a--)
            s[a].class ? i += '<div class="tree ' + s[a].class + '" />' : i += '<div style="width:' + s[a].width + 'px" />';
        i && $("#rcmtab" + this.html_identifier(e, !0)).html(i)
    }
    ,
    this.update_thread_root = function(e, t) {
        if (this.env.threading) {
            var s = this.message_list.find_root(e);
            if (e != s) {
                e = this.message_list.rows[s];
                if ("read" == t && e.unread_children)
                    e.unread_children--;
                else if ("unread" == t && e.has_children)
                    e.unread_children = (e.unread_children || 0) + 1;
                else if ("unflagged" == t && e.flagged_children)
                    e.flagged_children--;
                else {
                    if ("flagged" != t || !e.has_children)
                        return;
                    e.flagged_children = (e.flagged_children || 0) + 1
                }
                this.set_message_icon(s),
                this.set_unread_children(s),
                this.set_flagged_children(s)
            }
        }
    }
    ,
    this.update_thread = function(e) {
        if (!this.env.threading || !this.message_list.rows[e])
            return 0;
        var t, s, i = 0, n = this.message_list, a = n.rows, r = a[e], o = a[e].depth, l = [];
        for (r.depth || i--,
        r.depth && r.unread && (a[s = n.find_root(e)].unread_children--,
        this.set_unread_children(s)),
        r.depth && r.flagged && (a[s = n.find_root(e)].flagged_children--,
        this.set_flagged_children(s)),
        s = r.parent_uid,
        r = r.obj.nextSibling; r; ) {
            if (1 == r.nodeType && (t = a[r.uid])) {
                if (!t.depth || t.depth <= o)
                    break;
                t.depth--,
                $("#rcmtab" + t.id).width(15 * t.depth).html(""),
                t.depth ? (t.depth == o && (t.parent_uid = s),
                t.unread && l.length && l[l.length - 1].unread_children++) : (i++,
                t.parent_uid = 0,
                t.has_children && ($("#" + t.id + " .leaf").first().attr("id", "rcmexpando" + t.id).attr("class", "none" != t.obj.style.display ? "expanded" : "collapsed").mousedown({
                    uid: t.uid
                }, function(e) {
                    return ref.expand_message_row(e, e.data.uid)
                }),
                t.unread_children = 0,
                l.push(t)),
                "none" == t.obj.style.display && $(t.obj).show())
            }
            r = r.nextSibling
        }
        for (t = 0; t < l.length; t++)
            this.set_unread_children(l[t].uid),
            this.set_flagged_children(l[t].uid);
        return i
    }
    ,
    this.delete_excessive_thread_rows = function() {
        for (var e = this.message_list.rows, t = this.message_list.tbody.firstChild, s = this.env.pagesize + 1; t; )
            1 == t.nodeType && (r = e[t.uid]) && (!r.depth && s && s--,
            s || this.message_list.remove_row(t.uid)),
            t = t.nextSibling
    }
    ,
    this.set_message_icon = function(e) {
        var t, s = "", e = this.message_list.rows[e];
        if (!e)
            return !1;
        e.icon && (t = "msgicon",
        e.deleted ? (t += " deleted",
        s += this.get_label("deleted") + " ") : e.unread ? (t += " unread",
        s += this.get_label("unread") + " ") : e.unread_children && (t += " unreadchildren"),
        e.msgicon == e.icon && (e.replied && (t += " replied",
        s += this.get_label("replied") + " "),
        e.forwarded && (t += " forwarded",
        s += this.get_label("forwarded") + " "),
        t += " status"),
        $(e.icon).attr({
            class: t,
            title: s
        })),
        e.msgicon && e.msgicon != e.icon && (s = "",
        t = "msgicon",
        !e.unread && e.unread_children && (t += " unreadchildren"),
        e.replied && (t += " replied",
        s += this.get_label("replied") + " "),
        e.forwarded && (t += " forwarded",
        s += this.get_label("forwarded") + " "),
        $(e.msgicon).attr({
            class: t,
            title: s
        })),
        e.flagicon && (t = e.flagged ? "flagged" : "unflagged",
        s = this.get_label(t),
        $(e.flagicon).attr("class", t).attr({
            "aria-label": s,
            title: s
        }))
    }
    ,
    this.set_message_status = function(e, t, s) {
        var i = this.message_list.rows[e];
        if (!i)
            return !1;
        "unread" == t ? i.unread != s && this.update_thread_root(e, s ? "unread" : "read") : "flagged" == t && this.update_thread_root(e, s ? "flagged" : "unflagged"),
        -1 < $.inArray(t, ["unread", "deleted", "replied", "forwarded", "flagged"]) && (i[t] = s)
    }
    ,
    this.set_message = function(e, t, s) {
        var i = this.message_list && this.message_list.rows[e];
        if (!i)
            return !1;
        t && this.set_message_status(e, t, s),
        -1 < $.inArray(t, ["unread", "deleted", "flagged"]) && $(i.obj)[i[t] ? "addClass" : "removeClass"](t),
        this.set_unread_children(e),
        this.set_message_icon(e)
    }
    ,
    this.set_unread_children = function(e) {
        var t = this.message_list.rows[e];
        t.parent_uid || (e = !t.unread && t.unread_children && !t.expanded,
        $(t.obj)[e ? "addClass" : "removeClass"]("unroot"))
    }
    ,
    this.set_flagged_children = function(e) {
        var t = this.message_list.rows[e];
        t.parent_uid || (e = t.flagged_children && !t.expanded,
        $(t.obj)[e ? "addClass" : "removeClass"]("flaggedroot"))
    }
    ,
    this.copy_messages = function(e, s, i) {
        if (e && "object" == typeof e)
            e.uids && (i = e.uids),
            e = e.id;
        else if (!e)
            return i = this.env.uid ? [this.env.uid] : this.message_list.get_selection(),
            this.folder_selector(s, function(e, t) {
                ref.command("copy", {
                    id: e,
                    uids: i
                }, t, s, !0)
            });
        !e || e == this.env.mailbox || (e = this.selection_post_data({
            _target_mbox: e,
            _uid: i
        }))._uid && this.http_post("copy", e, this.display_message("copyingmessage", "loading"))
    }
    ,
    this.move_messages = function(e, s, i) {
        if (e && "object" == typeof e)
            e.uids && (i = e.uids),
            e = e.id;
        else if (!e)
            return i = this.env.uid ? [this.env.uid] : this.message_list.get_selection(),
            this.folder_selector(s, function(e, t) {
                ref.command("move", {
                    id: e,
                    uids: i
                }, t, s, !0)
            });
        var t;
        e && (e != this.env.mailbox || this.is_multifolder_listing()) && (t = !1,
        (e = this.selection_post_data({
            _target_mbox: e,
            _uid: i
        }))._uid && ("show" == this.env.action && (t = this.set_busy(!0, "movingmessage")),
        this.enable_command(this.env.message_commands, !1),
        this.with_selected_messages("move", e, t),
        "show" != this.env.action && this.show_contentframe(!1)))
    }
    ,
    this.delete_messages = function(e) {
        var t = this.message_list
          , s = this.env.trash_mailbox;
        return this.env.flag_for_deletion ? (this.mark_message("delete"),
        !1) : (!s || this.env.mailbox == s || this.env.delete_junk && this.env.junk_mailbox && this.env.mailbox == this.env.junk_mailbox ? this.permanently_remove_messages() : t && t.modkey == SHIFT_KEY || e && rcube_event.get_modifier(e) == SHIFT_KEY ? this.confirm_dialog(this.get_label("deletemessagesconfirm"), "delete", function() {
            ref.permanently_remove_messages()
        }) : this.move_messages(s),
        !0)
    }
    ,
    this.permanently_remove_messages = function() {
        var e = this.selection_post_data();
        e._uid && (this.with_selected_messages("delete", e),
        this.show_contentframe(!1))
    }
    ,
    this.with_selected_messages = function(e, t, s, i) {
        var n = 0
          , a = "delete" == e || !this.is_multifolder_listing();
        if (this.message_list) {
            var r, o, l, c, h = [], d = t._uid, _ = this.check_display_next();
            for ("*" === d ? d = this.message_list.get_selection() : "string" == typeof d && (d = d.split(",")),
            r = 0,
            o = d.length; r < o; r++)
                l = d[r],
                this.env.threading && (n += this.update_thread(l),
                (c = this.message_list.find_root(l)) != l && $.inArray(c, h) < 0 && h.push(c)),
                a && this.message_list.remove_row(l, _ && r == d.length - 1);
            for (!_ && a && this.message_list.clear_selection(),
            r = 0,
            o = h.length; r < o; r++)
                this.add_tree_icons(h[r])
        }
        n < 0 ? t._count = -1 * n : 0 < n && a && this.delete_excessive_thread_rows(),
        a || (t._refresh = 1),
        s = s || this.display_message("move" == e ? "movingmessage" : "deletingmessage", "loading"),
        this.http_post(i || e, t, s)
    }
    ,
    this.selection_post_data = function(e) {
        return (e = "object" != typeof e ? {} : e)._uid || (e._uid = this.env.uid ? [this.env.uid] : this.message_list.get_selection()),
        e._mbox = this.env.mailbox,
        e._uid = this.uids_to_list(e._uid),
        this.env.action && (e._from = this.env.action),
        this.env.search_request && (e._search = this.env.search_request),
        this.env.display_next && this.env.next_uid && (e._next_uid = this.env.next_uid),
        e
    }
    ,
    this.check_display_next = function() {
        return this.env.display_next && (this.preview_id || !this.env.contentframe)
    }
    ,
    this.mark_message = function(e, t) {
        var s, i, n, a = [], r = [], o = this.message_list;
        if (t ? a.push(t) : this.env.uid ? a.push(this.env.uid) : o && (a = o.get_selection()),
        o)
            for (o.focus(),
            i = 0,
            s = a.length; i < s; i++)
                n = a[i],
                ("read" == e && o.rows[n].unread || "unread" == e && !o.rows[n].unread || "delete" == e && !o.rows[n].deleted || "undelete" == e && o.rows[n].deleted || "flagged" == e && !o.rows[n].flagged || "unflagged" == e && o.rows[n].flagged) && r.push(n);
        else
            r = a;
        if (r.length || this.select_all_mode)
            switch (e) {
            case "read":
            case "unread":
                this.toggle_read_status(e, r);
                break;
            case "delete":
            case "undelete":
                this.toggle_delete_status(r);
                break;
            case "flagged":
            case "unflagged":
                this.toggle_flagged_status(e, a)
            }
    }
    ,
    this.toggle_read_status = function(e, t) {
        for (var s = t.length, i = this.selection_post_data({
            _uid: t,
            _flag: e
        }), n = this.display_message("markingmessage", "loading"), a = 0; a < s; a++)
            this.set_message(t[a], "unread", "unread" == e);
        this.http_post("mark", i, n)
    }
    ,
    this.toggle_flagged_status = function(e, t) {
        for (var s = t.length, i = this.env.contentframe ? this.get_frame_window(this.env.contentframe) : window, n = this.selection_post_data({
            _uid: t,
            _flag: e
        }), a = this.display_message("markingmessage", "loading"), r = 0; r < s; r++)
            this.set_message(t[r], "flagged", "flagged" == e);
        ("show" == this.env.action || 0 <= $.inArray(this.preview_id, t)) && $(i.document.body)["flagged" == e ? "addClass" : "removeClass"]("status-flagged"),
        this.http_post("mark", n, a)
    }
    ,
    this.toggle_delete_status = function(e) {
        var t, s, i = !0, n = e.length, a = this.message_list ? this.message_list.rows : {};
        if (1 == n)
            return !this.message_list || a[e[0]] && !a[e[0]].deleted ? this.flag_as_deleted(e) : this.flag_as_undeleted(e),
            !0;
        for (t = 0; t < n; t++)
            if (a[s = e[t]] && !a[s].deleted) {
                i = !1;
                break
            }
        return i ? this.flag_as_undeleted(e) : this.flag_as_deleted(e),
        !0
    }
    ,
    this.flag_as_undeleted = function(e) {
        for (var t = e.length, s = this.selection_post_data({
            _uid: e,
            _flag: "undelete"
        }), i = this.display_message("markingmessage", "loading"), n = 0; n < t; n++)
            this.set_message(e[n], "deleted", !1);
        this.http_post("mark", s, i)
    }
    ,
    this.flag_as_deleted = function(e) {
        for (var t = [], s = this.selection_post_data({
            _uid: e,
            _flag: "delete"
        }), i = this.display_message("markingmessage", "loading"), n = this.message_list, a = n ? n.rows : {}, r = 0, o = this.check_display_next(), l = 0, c = e.length; l < c; l++)
            uid = e[l],
            a[uid] && (a[uid].unread && (t[t.length] = uid),
            this.env.skip_deleted ? (r += this.update_thread(uid),
            n.remove_row(uid, o && l == n.get_selection(!1).length - 1)) : this.set_message(uid, "deleted", !0));
        this.env.skip_deleted && n && (o && n.rowcount || n.clear_selection(),
        r < 0 ? s._count = -1 * r : 0 < r && this.delete_excessive_thread_rows()),
        t.length && (s._ruid = this.uids_to_list(t)),
        this.env.skip_deleted && this.env.display_next && this.env.next_uid && (s._next_uid = this.env.next_uid),
        this.http_post("mark", s, i)
    }
    ,
    this.flag_deleted_as_read = function(e) {
        for (var t, s = this.message_list ? this.message_list.rows : {}, i = 0, n = (e = "string" == typeof e ? e.split(",") : e).length; i < n; i++)
            s[t = e[i]] && this.set_message(t, "unread", !1)
    }
    ,
    this.uids_to_list = function(e) {
        return this.select_all_mode ? "*" : !$.isArray(e) || 1 != e.length && -1 != String(e[0]).indexOf("-") ? e : e.join(",")
    }
    ,
    this.set_button_titles = function() {
        var e = "deletemessage";
        this.env.flag_for_deletion || !this.env.trash_mailbox || this.env.mailbox == this.env.trash_mailbox || this.env.delete_junk && this.env.junk_mailbox && this.env.mailbox == this.env.junk_mailbox || (e = "movemessagetotrash"),
        this.set_alttext("delete", e)
    }
    ,
    this.init_pagejumper = function(a) {
        $(a).addClass("rcpagejumper").on("focus", function(e) {
            for (var t = "", s = 1; s <= ref.env.pagecount; s++)
                t += "<li>" + s + "</li>";
            t = '<ul class="toolbarmenu menu">' + t + "</ul>",
            ref.pagejump || (ref.pagejump = $('<div id="pagejump-selector" class="popupmenu"></div>').appendTo(document.body).on("click", "li", function() {
                ref.busy || $(a).val($(this).text()).change()
            })),
            ref.pagejump.data("count") != s && ref.pagejump.html(t),
            ref.pagejump.attr("rel", "#" + this.id).data("count", s),
            ref.show_menu("pagejump-selector", !0, e),
            $(this).keydown()
        }).on("keydown keyup click", function(e) {
            var t = $("#pagejump-selector")
              , s = $("ul", t)
              , i = $("li", s)
              , n = (s.height(),
            parseInt(this.value));
            if (27 != e.which && 9 != e.which && 13 != e.which && !t.is(":visible"))
                return ref.show_menu("pagejump-selector", !0, e);
            if ("keydown" == e.type)
                if (40 == e.which)
                    i.length > n && (this.value = n += 1);
                else if (38 == e.which)
                    1 < n && i.length > n - 1 && (this.value = --n);
                else {
                    if (13 == e.which)
                        return $(this).change();
                    if (27 == e.which || 9 == e.which)
                        return ref.hide_menu("pagejump-selector", e),
                        $(a).val(ref.env.current_page)
                }
            $("li.selected", s).removeClass("selected"),
            (e = $(i[n - 1])).length && (e.addClass("selected"),
            $("#pagejump-selector").scrollTop(s.height() / i.length * (n - 1) - t.height() / 2))
        }).on("change", function(e) {
            var t = parseInt(this.value);
            t && t != ref.env.current_page && !ref.busy && (ref.hide_menu("pagejump-selector", e),
            ref.list_page(t))
        })
    }
    ,
    this.update_pagejumper = function() {
        $("input.rcpagejumper").val(this.env.current_page).prop("disabled", this.env.pagecount < 2)
    }
    ,
    this.check_mailvelope = function(e) {
        window.mailvelope ? this.mailvelope_load(e) : $(window).on("mailvelope", function() {
            ref.mailvelope_load(e)
        })
    }
    ,
    this.mailvelope_load = function(t) {
        function s(e) {
            ref.mailvelope_keyring = e,
            ref.mailvelope_init(t, e)
        }
        var i = this.env.mailvelope_main_keyring ? void 0 : this.env.user_id;
        mailvelope.getVersion().then(function(e) {
            return mailvelope.VERSION = e,
            mailvelope.VERSION_MAJOR = Math.floor(parseFloat(e)),
            mailvelope.getKeyring(i)
        }).then(s, function(e) {
            i ? mailvelope.createKeyring(i).then(s, function(e) {
                console.error(e)
            }) : console.error(e)
        })
    }
    ,
    this.mailvelope_init = function(e, t) {
        var s, i, n, a, r, o;
        window.mailvelope && ("show" == e || "preview" == e || "print" == e ? this.env.is_pgp_content ? (s = $(this.env.is_pgp_content).text(),
        ref.mailvelope_display_container(this.env.is_pgp_content, s, t)) : this.env.pgp_mime_part && (i = this.display_message("loadingdata", "loading"),
        n = this.env.pgp_mime_container,
        $.ajax({
            type: "GET",
            url: this.url("get", {
                _mbox: this.env.mailbox,
                _uid: this.env.uid,
                _part: this.env.pgp_mime_part
            }),
            error: function(e, t, s) {
                ref.http_error(e, t, s, i)
            },
            success: function(e) {
                ref.mailvelope_display_container(n, e, t, i)
            }
        })) : "compose" == e ? (this.env.compose_commands.push("compose-encrypted"),
        a = 2 <= mailvelope.VERSION_MAJOR,
        r = 0 < $('[name="_is_html"]').val(),
        a && this.env.compose_commands.push("compose-encrypted-signed"),
        this.env.pgp_mime_message ? (o = this.set_busy(!0, this.get_label("loadingdata")),
        $.ajax({
            type: "GET",
            url: this.url("get", this.env.pgp_mime_message),
            error: function(e, t, s) {
                ref.http_error(e, t, s, o),
                ref.enable_command("compose-encrypted", !r),
                a && ref.enable_command("compose-encrypted-signed", !r)
            },
            success: function(e) {
                ref.set_busy(!1, null, o),
                r && (ref.command("toggle-editor", {
                    html: !1,
                    noconvert: !0
                }),
                $("#" + ref.env.composebody).val("")),
                ref.compose_encrypted({
                    quotedMail: e
                }),
                ref.enable_command("compose-encrypted", !0),
                ref.enable_command("compose-encrypted-signed", !1)
            }
        })) : (this.enable_command("compose-encrypted", !r),
        a && this.enable_command("compose-encrypted-signed", !r)),
        this.addEventListener("actionafter", function(e) {
            e.ret && "toggle-editor" == e.action && (ref.enable_command("compose-encrypted", !e.props.html),
            a && ref.enable_command("compose-encrypted-signed", !e.props.html))
        })) : "edit-identity" == e && ref.mailvelope_identity_keygen())
    }
    ,
    this.compose_encrypted_signed = function(e) {
        (e = e || {}).signMsg = !0,
        this.compose_encrypted(e)
    }
    ,
    this.compose_encrypted = function(e) {
        var t, s = $("#" + this.env.composebody).parent();
        ref.mailvelope_editor ? (ref.mailvelope_editor = null,
        ref.set_button("compose-encrypted", "act"),
        s.removeClass("mailvelope").find("iframe:not([aria-hidden=true])").remove(),
        $("#" + ref.env.composebody).show(),
        $("[name='_pgpmime']").remove(),
        ref.enable_command("toggle-editor", "insert-response", !0),
        ref.enable_command("spellcheck", !!window.googie),
        ref.enable_command("insert-sig", !!(ref.env.signatures && ref.env.identity && ref.env.signatures[ref.env.identity])),
        ref.triggerEvent("compose-encrypted", {
            active: !1
        })) : (this.spellcheck_state() && this.editor.spellcheck_stop(),
        t = e.quotedMail ? {
            quotedMail: e.quotedMail,
            quotedMailIndent: !1
        } : {
            predefinedText: $("#" + this.env.composebody).val()
        },
        e.signMsg && (t.signMsg = e.signMsg),
        "reply" == this.env.compose_mode && (t.quotedMailIndent = !0,
        t.quotedMailHeader = this.env.compose_reply_header),
        mailvelope.createEditorContainer("#" + s.attr("id"), ref.mailvelope_keyring, t).then(function(e) {
            ref.mailvelope_editor = e,
            ref.set_button("compose-encrypted", "sel"),
            s.addClass("mailvelope"),
            $("#" + ref.env.composebody).hide(),
            ref.enable_command("spellcheck", "insert-sig", "toggle-editor", "insert-response", !1),
            ref.triggerEvent("compose-encrypted", {
                active: !0
            }),
            $.isEmptyObject(ref.env.attachments) || ("draft" == ref.env.compose_mode && 1 == Object.keys(ref.env.attachments).length && "encrypted.asc" == ref.env.attachments[Object.keys(ref.env.attachments)[0]].name || ref.alert_dialog(ref.get_label("encryptnoattachments")),
            $.each(ref.env.attachments, function(e, t) {
                ref.remove_from_attachment_list(e)
            }))
        }, function(e) {
            console.error(e),
            console.log(t)
        }))
    }
    ,
    this.mailvelope_submit_messageform = function(a, r) {
        var o = [];
        $.each(["to", "cc", "bcc"], function(e, t) {
            for (var s, i = $('[name="_' + t + '"]').val().trim(); i.length && rcube_check_email(i, !0); )
                s = RegExp.$2.replace(/^<+/, "").replace(/>+$/, ""),
                o.push(s),
                i = i.substr(i.indexOf(s) + s.length + 1).replace(/^\s*,\s*/, "")
        });
        var l = 0 < o.length;
        return ref.mailvelope_keyring.validKeyForAddress(o).then(function(e) {
            var s = [];
            if ($.each(e, function(e, t) {
                !1 === t && (l = !1,
                s.push(e))
            }),
            !l && s.length)
                return ref.simple_dialog(ref.get_label("nopubkeyfor").replace("$email", s.join(", ")) + "<p>" + ref.get_label("searchpubkeyservers") + "</p>", "encryptedsendialog", function() {
                    ref.mailvelope_search_pubkeys(s, function() {
                        return !0
                    })
                }, {
                    button: "search"
                }),
                !1;
            if (!l)
                return o.length || ref.alert_dialog(ref.get_label("norecipientwarning"), function() {
                    $("[name='_to']").focus()
                }),
                !1;
            var i = []
              , n = ref.env.identities[$("[name='_from'] option:selected").val()];
            $.each(ref.env.identities, function(e, t) {
                i.push(t.email)
            }),
            ref.mailvelope_keyring.validKeyForAddress(i).then(function(e) {
                return valid_sender = null,
                $.each(e, function(e, t) {
                    if (!1 !== t && (valid_sender = e,
                    valid_sender == n))
                        return !1
                }),
                !(!valid_sender && !confirm(ref.get_label("nopubkeyforsender"))) && (o.push(valid_sender),
                void ref.mailvelope_editor.encrypt(o).then(function(e) {
                    var t = ref.gui_objects.messageform
                      , s = $("[name='_pgpmime']", t)
                      , i = ref.set_busy(!0, a || r ? "savingmessage" : "sendingmessage");
                    t.target = ref.get_save_target(i),
                    t._draft.value = a ? "1" : "",
                    t.action = ref.add_url(t.action, "_unlock", i),
                    t.action = ref.add_url(t.action, "_framed", 1),
                    r && (t.action = ref.add_url(t.action, "_saveonly", 1)),
                    (s = !s.length ? $('<input type="hidden" name="_pgpmime">').appendTo(t) : s).val(e),
                    t.submit()
                }, function(e) {
                    console.log(e)
                }))
            }, function(e) {
                console.error(e)
            })
        }, function(e) {
            console.error(e)
        }),
        !1
    }
    ,
    this.mailvelope_display_container = function(t, e, s, i) {
        function n(e) {
            $(t + " > iframe").remove(),
            ref.hide_message(i),
            ref.display_message(e.message, "error")
        }
        mailvelope.createDisplayContainer(t, e, s, {
            senderAddress: this.env.sender
        }).then(function(e) {
            return e.error && e.error.message ? n(e.error) : (ref.hide_message(i),
            $(t).children().not("iframe").hide(),
            $(ref.gui_objects.messagebody).addClass("mailvelope"),
            ref.env.pgp_mime_part && $("#attach" + ref.env.pgp_mime_part).remove(),
            void setTimeout(function() {
                $(window).resize()
            }, 10))
        }, n)
    }
    ,
    this.mailvelope_search_pubkeys = function(e, t, s) {
        var n = []
          , a = new PublicKey(this.env.keyservers)
          , r = ref.display_message("", "loading");
        $.each(e, function(e, s) {
            var i = $.Deferred();
            a.search(s, function(e, t) {
                null !== t ? i.resolve([s]) : i.resolve([s].concat(e))
            }),
            n.push(i)
        }),
        $.when.apply($, n).then(function() {
            var i = []
              , n = [];
            $.each(arguments, function(e, t) {
                var s = t.shift();
                t.length ? n = n.concat(t) : i.push(s)
            }),
            ref.hide_message(r),
            t(!0),
            n.length && ref.mailvelope_key_import_dialog(n, s),
            i.length && ref.display_message(ref.get_label("nopubkeyfor").replace("$email", i.join(", ")), "warning")
        }).fail(function() {
            console.error("Pubkey lookup failed with", arguments),
            ref.hide_message(r),
            ref.display_message("pubkeysearcherror", "error"),
            t(!1)
        })
    }
    ,
    this.mailvelope_key_import_dialog = function(e, a) {
        var n = $("<div>").addClass("listing pgpkeyimport");
        $.each(e, function(e, t) {
            var s = $("<div>").addClass("key");
            t.revoked && s.addClass("revoked"),
            t.disabled && s.addClass("disabled"),
            t.expired && s.addClass("expired"),
            s.append($("<label>").addClass("keyid").text(ref.get_label("keyid"))),
            s.append($("<a>").text(t.keyid.substr(-8).toUpperCase()).attr({
                href: t.info,
                target: "_blank",
                tabindex: "-1"
            })),
            s.append($("<label>").addClass("keylen").text(ref.get_label("keylength"))),
            s.append($("<span>").text(t.keylen)),
            t.expirationdate && (s.append($("<label>").addClass("keyexpired").text(ref.get_label("keyexpired"))),
            s.append($("<span>").text(new Date(1e3 * t.expirationdate).toDateString()))),
            t.revoked && s.append($("<span>").addClass("keyrevoked").text(ref.get_label("keyrevoked")));
            var i = $("<ul>").addClass("uids");
            $.each(t.uids, function(e, t) {
                var s = $("<li>").addClass("uid");
                t.revoked && s.addClass("revoked"),
                t.disabled && s.addClass("disabled"),
                t.expired && s.addClass("expired"),
                i.append(s.text(t.uid))
            }),
            s.append(i),
            s.append($("<button>").attr("rel", t.keyid).text(ref.get_label("import")).addClass("button import importkey").prop("disabled", t.revoked || t.disabled || t.expired)),
            n.append(s)
        }),
        ref.simple_dialog($("<div>").append($("<p>").html(ref.get_label("encryptpubkeysfound"))).append(n), "importpubkeys", null, {
            cancel_label: "close",
            cancel_button: "close"
        }),
        n.on("click", "button.importkey", function() {
            var s = $(this)
              , i = s.attr("rel")
              , e = new PublicKey(ref.env.keyservers)
              , n = ref.display_message("", "loading");
            e.get(i, function(e, t) {
                ref.hide_message(n),
                t ? ref.display_message("keyservererror", "error") : a ? a(e) : ref.mailvelope_keyring.importPublicKey(e).then(function(e) {
                    "REJECTED" === e || (e = i.substr(-8).toUpperCase(),
                    s.closest(".key").fadeOut(),
                    ref.display_message(ref.get_label("keyimportsuccess").replace("$key", e), "confirmation"))
                }, function(e) {
                    console.log(e)
                })
            })
        })
    }
    ,
    this.mailvelope_identity_keygen = function() {
        var i = $(this.gui_objects.editform).find(".identity-encryption").first()
          , n = $(this.gui_objects.editform).find(".ff_email").val().trim();
        i.length && n && this.mailvelope_keyring.createKeyGenContainer && this.mailvelope_keyring.validKeyForAddress([n]).then(function(e) {
            var s = [];
            if (e && e[n] && Array.isArray(e[n].keys)) {
                for (var t = [], i = 0; i < e[n].keys.length; i++)
                    t.push(function(t) {
                        return ref.mailvelope_keyring.hasPrivateKey(t.fingerprint).then(function(e) {
                            e && s.push(t)
                        })
                    }(e[n].keys[i]));
                return Promise.all(t).then(function() {
                    return s
                })
            }
            return s
        }).then(function(e) {
            var s, t = i.find(".identity-encryption-block").empty();
            e && e.length ? ($("<p>").text(ref.get_label("encryptionprivkeysinmailvelope").replace("$nr", e.length)).appendTo(t),
            s = $("<ul>").addClass("keylist").appendTo(t),
            $.each(e, function(e, t) {
                $("<li>").appendTo(s).append($("<strong>").addClass("fingerprint").text(String(t.fingerprint).toUpperCase())).append($("<span>").addClass("identity").text("<" + n + "> "))
            })) : $("<p>").text(ref.get_label("encryptionnoprivkeysinmailvelope")).appendTo(t),
            $("<button>").attr("type", "button").addClass("button create").text(ref.get_label("encryptioncreatekey")).appendTo(t).on("click", function() {
                ref.mailvelope_show_keygen_container(t, n)
            }),
            $("<span>").addClass("space").html("&nbsp;").appendTo(t),
            $("<button>").attr("type", "button").addClass("button settings").text(ref.get_label("openmailvelopesettings")).appendTo(t).on("click", function() {
                ref.mailvelope_keyring.openSettings()
            }),
            i.show(),
            ref.triggerEvent("identity-encryption-show", {
                container: i
            })
        }).catch(function(e) {
            console.error("Mailvelope keyring error", e)
        })
    }
    ,
    this.mailvelope_show_keygen_container = function(t, s) {
        var e = (new Date).getTime()
          , i = {
            userIds: [{
                email: s,
                fullName: $(ref.gui_objects.editform).find(".ff_name").val().trim()
            }],
            keySize: this.env.mailvelope_keysize
        };
        $("<div>").attr("id", "mailvelope-keygen-container-" + e).css({
            height: "245px",
            marginBottom: "10px"
        }).appendTo(t.empty()),
        this.mailvelope_keyring.createKeyGenContainer("#mailvelope-keygen-container-" + e, i).then(function(e) {
            if (e instanceof Error)
                throw e;
            $("<button>").attr("type", "button").addClass("button mainaction generate").text(ref.get_label("generate")).appendTo(t).on("click", function() {
                var t = $(this).prop("disabled", !0);
                e.generate().then(function(e) {
                    "string" == typeof e && 0 < e.indexOf("BEGIN PGP") && (ref.display_message(ref.get_label("keypaircreatesuccess").replace("$identity", s), "confirmation"),
                    ref.mailvelope_identity_keygen())
                }).catch(function(e) {
                    ref.display_message(e.message || "errortitle", "error"),
                    t.prop("disabled", !1)
                })
            }),
            $("<span>").addClass("space").html("&nbsp;").appendTo(t),
            $("<button>").attr("type", "button").addClass("button cancel").text(ref.get_label("cancel")).appendTo(t).on("click", function() {
                ref.mailvelope_identity_keygen()
            }),
            ref.triggerEvent("identity-encryption-update", {
                container: t
            })
        }).catch(function(e) {
            ref.display_message("errortitle", "error"),
            ref.mailvelope_identity_keygen()
        })
    }
    ,
    this.mdn_request_dialog = function(e, t) {
        var i = {
            action: "mark",
            data: {
                _uid: e,
                _mbox: t,
                _flag: "mdnsent"
            }
        }
          , t = [{
            text: this.get_label("send"),
            class: "mainaction send",
            click: function(e, t, s) {
                i.action = "sendmdn",
                (ref.is_framed() ? parent.$ : $)(s || this).dialog("close")
            }
        }, {
            text: this.get_label("ignore"),
            class: "cancel",
            click: function(e, t, s) {
                (ref.is_framed() ? parent.$ : $)(s || this).dialog("close")
            }
        }];
        this.env.mdn_request_save && t.unshift({
            text: this.get_label("sendalwaysto").replace("$email", this.env.mdn_request_sender.mailto),
            class: "mainaction send",
            click: function(e, t, s) {
                i.data._save = ref.env.mdn_request_save,
                i.data._address = ref.env.mdn_request_sender.string,
                $(e.target).next().click()
            }
        }),
        this.show_popup_dialog(this.get_label("mdnrequest"), this.get_label("sendreceipt"), t, {
            close: function(e, t) {
                ref.http_post(i.action, i.data),
                $(this).remove()
            }
        })
    }
    ,
    this.expunge_mailbox = function(e) {
        var t, s = {
            _mbox: e
        };
        e == this.env.mailbox && (t = this.set_busy(!0, "loading"),
        s._reload = 1,
        this.env.search_request && (s._search = this.env.search_request)),
        this.http_post("expunge", s, t)
    }
    ,
    this.purge_mailbox = function(s) {
        return this.confirm_dialog(this.get_label("purgefolderconfirm"), "delete", function() {
            var e, t = {
                _mbox: s
            };
            s == ref.env.mailbox && (e = ref.set_busy(!0, "loading"),
            t._reload = 1),
            ref.http_post("purge", t, e)
        }),
        !1
    }
    ,
    this.mark_all_read = function(e, s) {
        var n, t, a = [], i = this.message_list, r = e || this.env.mailbox, e = {
            _uid: "*",
            _flag: "read",
            _mbox: r,
            _folders: s
        };
        if ("string" != typeof s) {
            if (!(n = this.mark_all_read_state(r)))
                return;
            if (1 < n)
                return $.each({
                    cur: 1,
                    sub: 2,
                    all: 4
                }, function(e, t) {
                    var s = "readallmode" + e
                      , i = $("<label>").attr("for", s).text(ref.get_label("folders-" + e))
                      , t = $("<input>").attr({
                        type: "radio",
                        value: e,
                        name: "mode",
                        id: s,
                        disabled: !(n & t)
                    });
                    a.push($("<li>").append([t, i]))
                }),
                t = $('<ul class="proplist">').append(a),
                $("input:not([disabled])", t).first().attr("checked", !0),
                void this.simple_dialog(t, "markallread", function() {
                    return ref.mark_all_read(r, $("input:checked", t).val()),
                    !0
                }, {
                    button: "mark",
                    button_class: "save"
                });
            e._folders = "cur"
        }
        $.each(i ? i.rows : [], function(e, t) {
            t.unread && (t = ref.env.messages[e].mbox,
            ("all" == s || t == ref.env.mailbox || "sub" == s && t.startsWith(ref.env.mailbox + ref.env.delimiter)) && ref.set_message(e, "unread", !1))
        }),
        this.http_post("mark", e, this.display_message("markingmessage", "loading"))
    }
    ,
    this.mark_all_read_state = function(e) {
        var t = 0
          , s = this.treelist.get_item(e || this.env.mailbox)
          , i = $(s).is(".unread") ? 1 : 0
          , e = $("li.unread", s).length
          , s = $("li.unread", ref.gui_objects.folderlist).length;
        return t += i,
        t += e ? 2 : 0,
        this.enable_command("mark-all-read", 0 < (t += i + e < s ? 4 : 0)),
        t
    }
    ,
    this.bounce = function(e, t, s) {
        var i = this.get_single_uid()
          , i = this.url("bounce", {
            _framed: 1,
            _uid: i,
            _mbox: this.get_message_mailbox(i)
        })
          , n = $("<iframe>").attr("src", i)
          , a = function() {
            var e = $("iframe", n)[0].contentWindow.rcmail;
            return {
                rc: e,
                form: e.gui_objects.messageform
            }
        }
          , r = function() {
            var e = {}
              , t = a();
            $.each($(t.form).serializeArray(), function() {
                e[this.name] = this.value
            }),
            e._uid = t.rc.env.uid,
            e._mbox = t.rc.env.mailbox,
            delete e._action,
            delete e._task,
            (e._to || e._cc || e._bcc) && (ref.http_post("bounce", e, ref.set_busy(!0, "sendingmessage")),
            n.dialog("close"))
        };
        return this.hide_menu("forwardmenu", s),
        n = this.simple_dialog(n, "bouncemsg", function() {
            var e = a();
            return "object" == typeof e.form && (!!e.rc.check_compose_address_fields(r, e.form) && r())
        }, {
            button: "bounce",
            width: 400,
            height: 300
        }),
        !0
    }
    ,
    this.open_compose_step = function(e) {
        e = this.url("mail/compose", e);
        this.env.compose_extwin && !this.env.extwin ? this.open_window(e) : (this.redirect(e),
        this.env.extwin && window.resizeTo(Math.max(this.env.popup_width, $(window).width()), $(window).height() + 24))
    }
    ,
    this.init_messageform = function() {
        if (!this.gui_objects.messageform)
            return !1;
        var e, t, s = $("[name='_from']"), i = $("[name='_to']"), n = $("[name='_subject']"), a = $("[name='_message']").get(0), r = "1" == $("[name='_is_html']").val(), o = this.opener();
        o && "compose" == o.env.action && (setTimeout(function() {
            1 < opener.history.length ? opener.history.back() : o.redirect(o.get_task_url("mail"))
        }, 100),
        this.env.opened_extwin = !0),
        r || (a.value && void 0 !== a.defaultValue && (a.value = a.defaultValue),
        t = this.env.top_posting && this.env.compose_mode ? 0 : a.value.length,
        "select-one" == s.prop("type") && (this.set_caret_pos(a, 0),
        this.change_identity(s[0])),
        this.set_caret_pos(a, t),
        t && $(a).scrollTop(a.scrollHeight)),
        this.env.save_localstorage && this.compose_restore_dialog(0, r),
        "" == i.val() ? e = i : "" == n.val() ? e = n : a && (e = a),
        this.env.compose_focus_elem = this.init_messageform_inputs(e),
        this.compose_field_hash(!0),
        this.auto_save_start()
    }
    ,
    this.init_messageform_inputs = function(e) {
        var t, s = $("[name='_to']"), i = ["cc", "bcc", "replyto", "followupto"];
        for (t in this.init_address_input_events(s),
        i)
            this.init_address_input_events($("[name='_" + i[t] + "']"));
        return e = e || s,
        $(e).focus().get(0)
    }
    ,
    this.compose_restore_dialog = function(e, t) {
        function s(e) {
            ++e < a.length && ref.compose_restore_dialog(e, t)
        }
        for (var i, n, a = this.local_storage_get_item("compose.index", []), r = e || 0; r < a.length; r++)
            if (i = a[r],
            n = this.local_storage_get_item("compose." + i, null, !0)) {
                if (n.changed && i == this.env.compose_id) {
                    this.restore_compose_form(i, t);
                    break
                }
                if ((!this.env.draft_id || !n.draft_id || n.draft_id == this.env.draft_id) && (!this.env.reply_msgid || n.reply_msgid == this.env.reply_msgid) && n.changed && n.session != this.env.session_id) {
                    this.show_popup_dialog(this.get_label("restoresavedcomposedata").replace("$date", new Date(n.changed).toLocaleString()).replace("$subject", n._subject).replace(/\n/g, "<br/>"), this.get_label("restoremessage"), [{
                        text: this.get_label("restore"),
                        class: "mainaction restore",
                        click: function() {
                            ref.restore_compose_form(i, t),
                            ref.remove_compose_data(i),
                            ref.save_compose_form_local(),
                            $(this).dialog("close")
                        }
                    }, {
                        text: this.get_label("delete"),
                        class: "delete",
                        click: function() {
                            ref.remove_compose_data(i),
                            $(this).dialog("close"),
                            s(r)
                        }
                    }, {
                        text: this.get_label("ignore"),
                        class: "cancel",
                        click: function() {
                            $(this).dialog("close"),
                            s(r)
                        }
                    }]);
                    break
                }
            }
    }
    ,
    this.init_address_input_events = function(e, t) {
        !t && 0 < this.env.autocomplete_threads && (t = {
            threads: this.env.autocomplete_threads,
            sources: this.env.autocomplete_sources
        }),
        e.keydown(function(e) {
            return ref.ksearch_keydown(e, this, t)
        }).attr({
            autocomplete: "off",
            "aria-autocomplete": "list",
            "aria-expanded": "false",
            role: "combobox"
        });
        e = function(e) {
            ref.ksearch_pane && e.target === ref.ksearch_pane.get(0) || ref.ksearch_hide()
        }
        ;
        $(document).on("click", e),
        document.addEventListener("scroll", e, !0)
    }
    ,
    this.submit_messageform = function(e, t) {
        var s = this.gui_objects.messageform;
        if (s) {
            if (!t && this.env.is_sent)
                return this.simple_dialog(this.get_label("messageissent"), "", function() {
                    return ref.submit_messageform(!1, !0),
                    !0
                });
            if (this.mailvelope_editor)
                return this.mailvelope_submit_messageform(e, t);
            var i = this.set_busy(!0, e || t ? "savingmessage" : "sendingmessage")
              , n = this.spellcheck_lang()
              , a = [];
            $("li", this.gui_objects.attachmentlist).each(function() {
                a.push(this.id.replace(/^rcmfile/, ""))
            }),
            $('[name="_attachments"]', s).val(a.join()),
            s.target = this.get_save_target(i),
            s._draft.value = e ? "1" : "",
            s.action = this.add_url(s.action, "_unlock", i),
            s.action = this.add_url(s.action, "_framed", 1),
            n && (s.action = this.add_url(s.action, "_lang", n)),
            t && (s.action = this.add_url(s.action, "_saveonly", 1)),
            this.submit_timer = setTimeout(function() {
                ref.set_busy(!1, null, i),
                ref.display_message("requesttimedout", "error")
            }, 1e3 * this.env.request_timeout),
            s.submit()
        }
    }
    ,
    this.compose_recipient_select = function(e) {
        for (var t, s = 0, i = e.get_selection(), n = 0; n < i.length; n++)
            t = i[n],
            this.env.contactdata[t] && s++;
        this.enable_command("add-recipient", s)
    }
    ,
    this.compose_add_recipient = function(e) {
        e = e || ((e = $(this.env.focused_field).filter(":visible")).length ? e.attr("id").replace("_", "") : "to");
        var t, s = [], i = $("#_" + e), n = this.contact_list.get_selection();
        if (this.contact_list && n.length)
            for (var a, r, o, l = 0; l < n.length; l++)
                (o = n[l]) && (a = this.env.contactdata[o]) && (r = a.name || a,
                "E" == o.charAt(0) && i.length && (r = "​" + r + "​",
                o = o.substr(1),
                this.group2expand[o] = {
                    name: r,
                    input: i.get(0)
                },
                this.http_request("group-expand", {
                    _source: a.source || this.env.source,
                    _gid: o
                }, !1)),
                s.push(r));
        return s.length && i.length && ((t = i.val()) && !/[,;]\s*$/.test(t) && (t += ", "),
        i.val(t + s.join(", ") + ", ").change(),
        this.triggerEvent("add-recipient", {
            field: e,
            recipients: s
        })),
        s.length
    }
    ,
    this.check_compose_input = function(e) {
        var t, s = $("[name='_subject']");
        for (t in this.env.attachments)
            if ("object" == typeof this.env.attachments[t] && !this.env.attachments[t].complete)
                return this.alert_dialog(this.get_label("notuploadedwarning")),
                !1;
        if (this.env.nosubject_warned || "" != s.val())
            return this.mailvelope_editor || this.editor.get_content() || confirm(this.get_label("nobodywarning")) ? !!this.check_compose_address_fields(e) && (this.editor.save(),
            !0) : (this.editor.focus(),
            !1);
        var i = $("<input>").attr({
            type: "text",
            size: 40,
            "data-submit": "true"
        })
          , n = $('<div class="prompt">').append($('<p class="message">').text(this.get_label("nosubjectwarning"))).append(i)
          , a = this.show_popup_dialog(n, this.get_label("nosubjecttitle"), [{
            text: this.get_label("sendmessage"),
            class: "mainaction send",
            click: function() {
                s.val(i.val()),
                a.dialog("close"),
                ref.check_compose_input(e) && ref.command(e, {
                    nocheck: !0
                })
            }
        }, {
            text: this.get_label("cancel"),
            class: "cancel",
            click: function() {
                s.focus(),
                a.dialog("close")
            }
        }], {
            dialogClass: "warning"
        });
        return !(this.env.nosubject_warned = !0)
    }
    ,
    this.check_compose_address_fields = function(t, e) {
        e = e || window.document;
        var s, i = this.env.max_disclosed_recipients, n = $("[name='_to']", e), a = $("[name='_cc']", e), r = $("[name='_bcc']", e), o = $("[name='_from']", e), e = function(e) {
            return (e = $.map(e, function(e) {
                return (e = e.val().trim()).length ? e : null
            })).join(",").replace(/^[\s,;]+/, "").replace(/[\s,;]+$/, "")
        };
        if ("text" == o.prop("type") && !rcube_check_email(o.val(), !0))
            return this.alert_dialog(this.get_label("nosenderwarning"), function() {
                o.focus()
            }),
            !1;
        if (!rcube_check_email(e([n, a, r]), !0))
            return this.alert_dialog(this.get_label("norecipientwarning"), function() {
                n.focus()
            }),
            !1;
        if (i && !this.env.disclosed_recipients_warned && rcube_check_email(s = e([n, a]), !0, !0) > i) {
            function l(e) {
                e && (e = r.val(),
                r.val((e ? e + ", " : "") + s).change(),
                n.val("").change(),
                a.val("").change()),
                c.dialog("close"),
                "function" == typeof t ? t() : t && ref.command(t, {
                    nocheck: !0
                })
            }
            var c = this.show_popup_dialog(this.get_label("disclosedrecipwarning"), this.get_label("disclosedreciptitle"), [{
                text: this.get_label("sendmessage"),
                click: function() {
                    l(!1)
                },
                class: "mainaction"
            }, {
                text: this.get_label("bccinstead"),
                click: function() {
                    l(!0)
                }
            }, {
                text: this.get_label("cancel"),
                click: function() {
                    c.dialog("close")
                },
                class: "cancel"
            }], {
                dialogClass: "warning"
            });
            return !(this.env.disclosed_recipients_warned = !0)
        }
        return !0
    }
    ,
    this.toggle_editor = function(e, t, s) {
        var i = this.editor.toggle(e.html, e.noconvert || !1)
          , s = $("#" + this.editor.id).data("control") || $(s ? s.target : [])
          , e = i ? e.html ? "html" : "plain" : e.html ? "plain" : "html";
        return $("[name='_is_html']").val("html" == e ? 1 : 0),
        s.is("[type=checkbox]") ? s.prop("checked", "html" == e) : s.val(e),
        i
    }
    ,
    this.insert_response = function(e) {
        var t;
        "object" == typeof e ? ((t = {})[e.is_html ? "html" : "text"] = e.data,
        this.editor.replace(t),
        this.display_message("responseinserted", "confirmation")) : (t = this.display_message("", "loading"),
        this.http_get("settings/response-get", {
            _id: e,
            _is_html: this.editor.is_html() ? 1 : 0
        }, t))
    }
    ,
    this.spellcheck_state = function() {
        var s = this.editor.spellcheck_state();
        return $.each(this.buttons.spellcheck || [], function(e, t) {
            $("#" + t.id)[s ? "addClass" : "removeClass"]("selected")
        }),
        s
    }
    ,
    this.spellcheck_lang = function() {
        return this.editor.get_language()
    }
    ,
    this.spellcheck_lang_set = function(e) {
        this.editor.set_language(e)
    }
    ,
    this.spellcheck_resume = function(e) {
        this.editor.spellcheck_resume(e)
    }
    ,
    this.set_draft_id = function(e) {
        var t;
        e && e != this.env.draft_id && ((t = this.opener(!(t = {
            task: "mail",
            action: ""
        }), t) || this.opener(!0, t)) && t.env.mailbox == this.env.drafts_mailbox && t.command("checkmail"),
        this.env.draft_id = e,
        $("[name='_draft_saveid']").val(e)),
        this.remove_compose_data(this.env.compose_id),
        this.compose_skip_unsavedcheck = !1
    }
    ,
    this.get_save_target = function(e) {
        return this.dummy_iframe("savetarget", "javascript:false;").on("load error", function() {
            e && 0 == $(this).contents().find('meta[name="generator"][content="Roundcube"]').length && (ref.iframe_loaded(e),
            ref.display_message("connerror", "error")),
            $(this).remove()
        }),
        "savetarget"
    }
    ,
    this.auto_save_start = function() {
        this.env.draft_autosave && (this.save_timer = setTimeout(function() {
            ref.command("savedraft")
        }, 1e3 * this.env.draft_autosave)),
        !this.local_save_timer && window.localStorage && this.env.save_localstorage && (this.compose_type_activity = this.compose_type_activity_last = 0,
        $(document).keypress(function(e) {
            ref.compose_type_activity++
        }),
        this.local_save_timer = setInterval(function() {
            ref.compose_type_activity > ref.compose_type_activity_last && (ref.save_compose_form_local(),
            ref.compose_type_activity_last = ref.compose_type_activity)
        }, 5e3),
        $(window).on("unload", function() {
            ref.env.server_error || ref.remove_compose_data(ref.env.compose_id)
        })),
        window.onbeforeunload || (window.onbeforeunload = function() {
            if (!ref.compose_skip_unsavedcheck && ref.cmp_hash != ref.compose_field_hash())
                return ref.get_label("notsentwarning")
        }
        ),
        this.busy = !1
    }
    ,
    this.compose_field_hash = function(e) {
        for (var t, s, i = "", n = ["to", "cc", "bcc", "subject"], a = 0; a < n.length; a++)
            (s = $('[name="_' + n[a] + '"]').val()) && (i += s + ":");
        for (t in i += this.editor.get_content({
            refresh: !1
        }),
        this.env.attachments)
            i += t;
        return this.mailvelope_editor && (i += ";" + (new Date).getTime()),
        e && (this.cmp_hash = i),
        i
    }
    ,
    this.save_compose_form_local = function() {
        var s, i, e, t;
        this.env.save_localstorage && (s = {
            session: this.env.session_id,
            changed: (new Date).getTime()
        },
        i = !0,
        this.editor.save(),
        this.env.draft_id && (s.draft_id = this.env.draft_id),
        this.env.reply_msgid && (s.reply_msgid = this.env.reply_msgid),
        $("input, select, textarea", this.gui_objects.messageform).each(function(e, t) {
            switch (t.tagName.toLowerCase()) {
            case "input":
                if ("button" == t.type || "submit" == t.type || "hidden" == t.type && "_is_html" != t.name)
                    break;
                s[t.name] = "checkbox" != t.type || t.checked ? $(t).val() : "",
                "" != s[t.name] && "hidden" != t.type && (i = !1);
                break;
            case "select":
                s[t.name] = $("option:checked", t).val();
                break;
            default:
                s[t.name] = $(t).val(),
                "" != s[t.name] && (i = !1)
            }
        }),
        i || (e = this.local_storage_get_item("compose.index", []),
        t = this.env.compose_id,
        $.inArray(t, e) < 0 && e.push(t),
        this.local_storage_set_item("compose." + t, s, !0),
        this.local_storage_set_item("compose.index", e)))
    }
    ,
    this.restore_compose_form = function(e, t) {
        e = this.local_storage_get_item("compose." + e, !0);
        e && "object" == typeof e && ($.each(e, function(e, t) {
            "_" == e[0] && ((e = $("[name=" + e + "]"))[0] && "checkbox" == e[0].type ? e.prop("checked", "" != t) : e.val(t).change())
        }),
        ("1" == e._is_html && !t || "1" != e._is_html && t) && this.command("toggle-editor", {
            id: this.env.composebody,
            html: !t,
            noconvert: !0
        }))
    }
    ,
    this.remove_compose_data = function(s) {
        var e = this.local_storage_get_item("compose.index", []);
        0 <= $.inArray(s, e) && (this.local_storage_remove_item("compose." + s),
        this.local_storage_set_item("compose.index", $.grep(e, function(e, t) {
            return e != s
        })))
    }
    ,
    this.clear_compose_data = function() {
        for (var e = this.local_storage_get_item("compose.index", []), t = 0; t < e.length; t++)
            this.local_storage_remove_item("compose." + e[t]);
        this.local_storage_remove_item("compose.index")
    }
    ,
    this.change_identity = function(e, t) {
        if (!e || !e.options)
            return !1;
        var a = $(e).val()
          , s = this.env.signatures && this.env.signatures[a]
          , r = this.env.identity
          , e = t || this.env.show_sig;
        return s ? (this.enable_command("insert-sig", !0),
        this.env.compose_commands.push("insert-sig"),
        s = !0) : this.enable_command("insert-sig", !1),
        this.env.identities_initialized || (this.env.identities_initialized = !0,
        this.env.show_sig_later && (this.env.show_sig = !0),
        !this.env.opened_extwin) ? ($.each(["replyto", "bcc"], function() {
            var e, t = r && ref.env.identities[r] ? ref.env.identities[r][this] : "", s = a && ref.env.identities[a] ? ref.env.identities[a][this] : "", i = $('[name="_' + this + '"]'), n = i.val();
            t && n && (e = new RegExp("\\s*" + RegExp.escape(t) + "\\s*"),
            n = n.replace(e, "")),
            n = String(n).replace(/[,;]\s*[,;]/g, ",").replace(/^[\s,;]+/, ""),
            s && -1 == n.indexOf(s) && -1 == n.indexOf(s.replace(/"/g, "")) && (n = n && n.replace(/[,;\s]+$/, "") + ", ",
            n += s + ", "),
            (t || s) && i.val(n).change()
        }),
        this.editor && this.editor.change_signature(a, e),
        t && s && this.display_message("siginserted", "confirmation"),
        this.env.identity = a,
        this.triggerEvent("change_identity"),
        !0) : void 0
    }
    ,
    this.upload_input = function(e) {
        $("#" + e + ' input[type="file"]').click()
    }
    ,
    this.upload_file = function(e, t, s) {
        if (e) {
            var i, n = [];
            return $("input", e).each(function() {
                if (this.files) {
                    i = this.name;
                    for (var e = 0; e < this.files.length; e++)
                        n.push(this.files[e])
                }
            }),
            this.file_upload(n, {
                _id: this.env.compose_id || ""
            }, {
                name: i,
                action: t,
                lock: s
            })
        }
    }
    ,
    this.add2attachment_list = function(e, t, s) {
        if (s && this.triggerEvent("fileuploaded", {
            name: e,
            attachment: t,
            id: s
        }),
        s && this.env.attachments[s] && delete this.env.attachments[s],
        this.env.attachments[e] = t,
        !this.gui_objects.attachmentlist)
            return !1;
        var i, n = $("<li>");
        !t.complete && t.html.indexOf("<") < 0 && (t.html = '<span class="uploading">' + t.html + "</span>"),
        !t.complete && this.env.loadingicon && (t.html = '<img src="' + this.env.loadingicon + '" alt="" class="uploading" />' + t.html),
        t.complete || (i = this.get_label("cancel"),
        t.html = '<a title="' + i + '" onclick="return rcmail.cancel_attachment_upload(\'' + e + '\');" href="#cancelupload" class="cancelupload">' + (this.env.cancelicon ? '<img src="' + this.env.cancelicon + '" alt="' + i + '" />' : '<span class="inner">' + i + "</span>") + "</a>" + t.html),
        n.attr("id", e).addClass(t.classname).html(t.html).find(".attachment-name").on("mouseover", function() {
            rcube_webmail.long_subject_title_ex(this)
        }),
        s && (a = document.getElementById(s)) ? n.replaceAll(a) : n.appendTo(this.gui_objects.attachmentlist);
        var a = $(this.gui_objects.attachmentlist).attr("data-tabindex") || "0";
        return n.find("a").attr("tabindex", a),
        this.triggerEvent("fileappended", {
            name: e,
            attachment: t,
            id: s,
            item: n
        }),
        !0
    }
    ,
    this.remove_from_attachment_list = function(e) {
        delete this.env.attachments[e],
        $("#" + e).remove()
    }
    ,
    this.remove_attachment = function(e) {
        return e && this.env.attachments[e] && this.http_post("remove-attachment", {
            _id: this.env.compose_id,
            _file: e
        }),
        !1
    }
    ,
    this.cancel_attachment_upload = function(e) {
        return e && this.uploads[e] && (this.remove_from_attachment_list(e),
        this.uploads[e].abort()),
        !1
    }
    ,
    this.rename_attachment = function(t) {
        var s, e, i = this.env.attachments[t];
        i && (s = $("<input>").attr({
            type: "text",
            size: 50
        }).val(i.name),
        e = $("<label>").text(this.get_label("namex")).append(s),
        this.simple_dialog(e, "attachmentrename", function() {
            var e;
            if ((e = s.val()) && e != i.name)
                return ref.http_post("rename-attachment", {
                    _id: ref.env.compose_id,
                    _file: t,
                    _name: e
                }, ref.set_busy(!0, "loading")),
                !0
        }))
    }
    ,
    this.rename_attachment_handler = function(e, t) {
        var s = this.env.attachments[e];
        s && t && (s.name = t,
        $("#" + e + " .attachment-name").text(t).attr("title", ""))
    }
    ,
    this.add_contact = function(e, t, s) {
        e && this.http_post("addcontact", {
            _address: e,
            _reload: t,
            _source: s
        })
    }
    ,
    this.qsearch = function(e) {
        if ("" != e || $(this.gui_objects.qsearchbox).val() || $(this.gui_objects.search_interval).val()) {
            var t = this.set_busy(!0, "searching")
              , s = this.search_params(e)
              , e = "compose" == this.env.action && this.contact_list ? "search-contacts" : "search";
            return this.message_list ? this.clear_message_list() : this.contact_list && this.list_contacts_clear(),
            this.env.source && (s._source = this.env.source),
            this.env.group && (s._gid = this.env.group),
            this.env.current_page = 1,
            s = this.http_request(e, s, t),
            this.env.qsearch = {
                lock: t,
                request: s
            },
            this.enable_command("set-listmode", this.env.threads && "base" == (this.env.search_scope || "base")),
            !0
        }
        return !1
    }
    ,
    this.continue_search = function(t) {
        var s = this.set_busy(!0, "stillsearching");
        setTimeout(function() {
            var e = ref.search_params();
            e._continue = t,
            ref.env.qsearch = {
                lock: s,
                request: ref.http_request("search", e, s)
            }
        }, 100)
    }
    ,
    this.search_params = function(e, t) {
        var s, i = {}, n = [], a = this.env.search_mods, r = this.env.search_scope || "base", o = this.env.mailbox;
        if (!t && this.gui_objects.search_filter && (t = this.gui_objects.search_filter.value),
        !e && this.gui_objects.qsearchbox && (e = this.gui_objects.qsearchbox.value),
        this.gui_objects.search_interval && (i._interval = $(this.gui_objects.search_interval).val()),
        e && (i._q = e,
        a = a && this.message_list ? a[o] || a["*"] : a)) {
            for (s in a)
                n.push(s);
            i._headers = n.join(",")
        }
        return i._layout = this.env.layout,
        i._filter = t,
        i._scope = r,
        i._mbox = o,
        i
    }
    ,
    this.reset_search_filter = function() {
        this.filter_disabled = !0,
        this.gui_objects.search_filter && $(this.gui_objects.search_filter).val("ALL").change(),
        this.filter_disabled = !1
    }
    ,
    this.reset_qsearch = function(e) {
        this.gui_objects.qsearchbox && (this.gui_objects.qsearchbox.value = ""),
        this.gui_objects.search_interval && $(this.gui_objects.search_interval).val(""),
        this.env.qsearch && this.abort_request(this.env.qsearch),
        e && (this.env.search_scope = "base",
        this.reset_search_filter()),
        this.env.qsearch = null,
        this.env.search_request = null,
        this.env.search_id = null,
        this.select_all_mode = !1,
        this.enable_command("set-listmode", this.env.threads)
    }
    ,
    this.set_searchscope = function(e) {
        this.env.search_scope = e
    }
    ,
    this.set_searchinterval = function(e) {
        this.env.search_interval = e
    }
    ,
    this.set_searchmods = function(e) {
        var t = this.env.mailbox;
        this.env.search_scope;
        this.env.search_mods || (this.env.search_mods = {}),
        t && (this.env.search_mods[t] = e)
    }
    ,
    this.is_multifolder_listing = function() {
        return void 0 !== this.env.multifolder_listing ? this.env.multifolder_listing : this.env.search_request && "base" != (this.env.search_scope || "base")
    }
    ,
    this.sent_successfully = function(e, t, s, i) {
        var n;
        this.display_message(t, e),
        this.compose_skip_unsavedcheck = !0,
        this.env.extwin ? (i || this.lock_form(this.gui_objects.messageform),
        (n = this.opener(!(n = {
            task: "mail",
            action: ""
        }), n) || this.opener(!0, n)) && (n.display_message(t, e),
        s && 0 <= $.inArray(n.env.mailbox, s) && n.command("checkmail")),
        i || setTimeout(function() {
            window.close()
        }, 1e3)) : i || setTimeout(function() {
            ref.list_mailbox()
        }, 500),
        i && (this.env.is_sent = !0)
    }
    ,
    this.image_rotate = function() {
        var e = this.image_style && this.image_style.rotate || 0;
        this.image_style.rotate = 180 < e ? 0 : e + 90,
        this.apply_image_style()
    }
    ,
    this.image_scale = function(e) {
        var t = this.image_style && this.image_style.scale || 1;
        this.image_style.scale = Math.max(.1, t + .1 * ("-" == e ? -1 : 1)),
        this.apply_image_style()
    }
    ,
    this.apply_image_style = function() {
        var i = []
          , e = $(this.gui_objects.messagepartframe).contents().find("head");
        $("#image-style", e).remove(),
        $.each({
            scale: "",
            rotate: "deg"
        }, function(e, t) {
            var s = ref.image_style[e];
            s && i.push(e + "(" + s + t + ")")
        }),
        i && e.append($('<style id="image-style">').text("img { transform: " + i.join(" ") + "}"))
    }
    ,
    this.import_state_set = function(e) {
        var t;
        this.import_dialog && (this.import_state = e,
        t = $(this.import_dialog).parent().find(".ui-dialog-buttonset > button").first(),
        "error" != e ? (t.hide(),
        t.next().text(this.gettext("close")).focus()) : t.prop("disabled", !1))
    }
    ,
    this.ksearch_keydown = function(e, t, s) {
        this.ksearch_timer && clearTimeout(this.ksearch_timer);
        var i = rcube_event.get_keycode(e);
        switch (i) {
        case 38:
        case 40:
            if (!this.ksearch_visible())
                return;
            var n = 38 == i ? 1 : 0
              , a = this.ksearch_pane.find("li.selected")[0];
            return (a = a || this.ksearch_pane.__ul.firstChild) && this.ksearch_select(n ? a.previousSibling : a.nextSibling),
            rcube_event.cancel(e);
        case 9:
            if (rcube_event.get_modifier(e) == SHIFT_KEY || !this.ksearch_visible())
                return void this.ksearch_hide();
        case 13:
            return this.ksearch_visible() ? (this.insert_recipient(this.ksearch_selected),
            this.ksearch_hide(),
            9 == i ? null : rcube_event.cancel(e)) : !1;
        case 27:
            return void this.ksearch_hide();
        case 37:
        case 39:
            return
        }
        return this.ksearch_timer = setTimeout(function() {
            ref.ksearch_get_results(s)
        }, 200),
        this.ksearch_input = t,
        !0
    }
    ,
    this.ksearch_visible = function() {
        return null !== this.ksearch_selected && void 0 !== this.ksearch_selected && this.ksearch_value
    }
    ,
    this.ksearch_select = function(e) {
        this.ksearch_pane && e && this.ksearch_pane.find("li.selected").removeClass("selected").removeAttr("aria-selected"),
        e && ($(e).addClass("selected").attr("aria-selected", "true"),
        this.ksearch_selected = e._rcm_id,
        $(this.ksearch_input).attr("aria-activedescendant", "rcmkSearchItem" + this.ksearch_selected))
    }
    ,
    this.insert_recipient = function(e) {
        var t, s, i;
        null !== e && this.env.contacts[e] && this.ksearch_input && (t = !1,
        i = "",
        s = this.env.contacts[e],
        this.ksearch_destroy(),
        "object" == typeof s && "group" == s.type && !s.email && s.id ? (i = (e = "​" + s.name + "​") + ", ",
        this.group2expand[s.id] = {
            name: e,
            input: this.ksearch_input
        },
        this.http_request("mail/group-expand", {
            _source: s.source,
            _gid: s.id
        }, !1)) : "object" == typeof s && s.name ? (i = s.name + ", ",
        t = !0) : "string" == typeof s && (i = s + ", ",
        t = !0),
        this.ksearch_input_replace(this.ksearch_value, i, null, t),
        t && (this.triggerEvent("autocomplete_insert", {
            field: this.ksearch_input,
            insert: i,
            data: s,
            search: this.ksearch_value_last,
            result_type: "person"
        }),
        this.ksearch_value_last = null,
        this.compose_type_activity++))
    }
    ,
    this.replace_group_recipients = function(e, t) {
        var s = this.group2expand[e];
        s && (this.ksearch_input_replace(s.name, t, s.input),
        this.triggerEvent("autocomplete_insert", {
            field: s.input,
            insert: t,
            data: s,
            search: this.ksearch_value_last,
            result_type: "group"
        }),
        this.ksearch_value_last = null,
        this.group2expand[e] = null,
        this.compose_type_activity++)
    }
    ,
    this.ksearch_get_results = function(e) {
        this.ksearch_pane && this.ksearch_pane.is(":visible") && this.ksearch_pane.hide();
        var t = this.ksearch_input_get()
          , s = this.env.autocomplete_min_length
          , i = this.ksearch_data;
        (t = t.trim()) != this.ksearch_value && (this.ksearch_destroy(),
        t.length && t.length < s ? this.ksearch_info || (this.ksearch_info = this.display_message(this.get_label("autocompletechars").replace("$min", s))) : (s = this.ksearch_value,
        this.ksearch_value = t,
        (this.ksearch_value_last = t).length && (s && s.length && t.startsWith(s) && (!i || i.num <= 0) && this.env.contacts && !this.env.contacts.length || (i = e && e.sources ? e.sources : [""],
        t = this.multi_thread_http_request({
            items: i,
            threads: e && e.threads ? e.threads : 1,
            action: e && e.action ? e.action : "mail/autocomplete",
            postdata: {
                _search: t,
                _source: "%s"
            },
            lock: this.display_message("searching", "loading")
        }),
        this.ksearch_data = {
            id: t,
            sources: i.slice(),
            num: i.length
        }))))
    }
    ,
    this.ksearch_query_results = function(e, t, s) {
        if (this.multi_thread_http_response(e, s),
        this.ksearch_value && (!this.ksearch_input || t == this.ksearch_value)) {
            var i, n, a, r, o, l, c = this.is_framed(), h = this.ksearch_value, d = this.env.autocomplete_max || 15;
            if (this.ksearch_pane || (r = $("<ul>"),
            this.ksearch_pane = $("<div>").attr({
                id: "rcmKSearchpane",
                role: "listbox",
                class: "select-menu inline"
            }).css({
                position: "absolute",
                "z-index": 3e4
            }).append(r).appendTo((c ? parent.document : document).body),
            this.ksearch_pane.__ul = r[0],
            this.triggerEvent("autocomplete_create", {
                obj: this.ksearch_pane
            })),
            r = this.ksearch_pane.__ul,
            s && this.ksearch_pane.data("reqid") == s)
                d -= r.childNodes.length;
            else {
                this.ksearch_pane.data("reqid", s),
                r.innerHTML = "",
                this.env.contacts = [];
                var _ = $("html").is(".layout-small,.layout-phone") && 1 == $(this.ksearch_input).parents(".ac-input").length
                  , u = (_ ? $(this.ksearch_input).parents(".ac-input") : $(this.ksearch_input))[0]
                  , m = $(u).offset();
                if (m.left -= $(document.documentElement).scrollLeft(),
                m.top -= $(document.documentElement).scrollTop(),
                c)
                    try {
                        parent.$("iframe").each(function() {
                            var e;
                            this.contentWindow == window && (e = $(this).offset(),
                            m.left += e.left,
                            m.top += e.top)
                        })
                    } catch (e) {}
                var p = $(c ? parent : window).width()
                  , t = $(u).outerWidth()
                  , c = 200 < p - m.left ? m.left : p - 200
                  , u = m.top + u.offsetHeight + 1
                  , p = Math.min(400, p - c);
                this.ksearch_pane.css({
                    left: (_ ? m.left : c) + "px",
                    top: u + "px",
                    maxWidth: (_ ? t : p) + "px",
                    minWidth: "200px",
                    width: _ ? t + "px" : "auto",
                    display: "none"
                })
            }
            if (e && (a = e.length))
                for (i = 0; i < a && 0 < d; i++)
                    o = "object" == typeof e[i] ? e[i].display || e[i].name : e[i],
                    l = "object" == typeof e[i] ? e[i].type : "",
                    n = i + this.env.contacts.length,
                    $("<li>").attr({
                        id: "rcmkSearchItem" + n,
                        role: "option"
                    }).html('<i class="icon"></i>' + this.quote_html(o.replace(new RegExp("(" + RegExp.escape(h) + ")","ig"), "##$1%%")).replace(/##([^%]+)%%/g, "<b>$1</b>")).addClass(l || "").appendTo(r).mouseover(function() {
                        ref.ksearch_select(this)
                    }).mouseup(function() {
                        ref.ksearch_click(this)
                    }).get(0)._rcm_id = n,
                    --d;
            r.childNodes.length && ($(this.ksearch_input).attr({
                "aria-haspopup": "true",
                "aria-expanded": "true",
                "aria-owns": "rcmKSearchpane"
            }),
            this.ksearch_pane.show(),
            this.env.contacts.length || this.ksearch_select($("li", r)[0])),
            a && (this.env.contacts = this.env.contacts.concat(e)),
            this.ksearch_data.id == s && this.ksearch_data.num--
        }
    }
    ,
    this.ksearch_input_get = function() {
        if (!this.ksearch_input)
            return "";
        var e = this.get_caret_pos(this.ksearch_input);
        return this.ksearch_input.value.substr(0, e).split(/[,;]/).pop()
    }
    ,
    this.ksearch_input_replace = function(e, t, s, i) {
        var n, a, r;
        (this.ksearch_input || s) && (s = s || this.ksearch_input,
        n = this.get_caret_pos(s),
        r = s.value.lastIndexOf(e, n),
        a = s.value.substring(0, r),
        r = s.value.substring(r + e.length, s.value.length),
        s.value = a + t + r,
        this.set_caret_pos(s, n + t.length - e.length),
        $(s).trigger("change", [!0, i]))
    }
    ,
    this.ksearch_click = function(e) {
        this.ksearch_input && this.ksearch_input.focus(),
        this.insert_recipient(e._rcm_id),
        this.ksearch_hide()
    }
    ,
    this.ksearch_blur = function() {
        this.ksearch_timer && clearTimeout(this.ksearch_timer),
        this.ksearch_input = null,
        this.ksearch_hide()
    }
    ,
    this.ksearch_hide = function() {
        this.ksearch_selected = null,
        this.ksearch_value = "",
        this.ksearch_pane && this.ksearch_pane.hide(),
        $(this.ksearch_input).attr({
            "aria-haspopup": "false",
            "aria-expanded": "false"
        }).removeAttr("aria-activedescendant").removeAttr("aria-owns"),
        this.ksearch_destroy()
    }
    ,
    this.ksearch_destroy = function() {
        this.ksearch_data && this.multi_thread_request_abort(this.ksearch_data.id),
        this.ksearch_info && this.hide_message(this.ksearch_info),
        this.ksearch_msg && this.hide_message(this.ksearch_msg),
        this.ksearch_data = null,
        this.ksearch_info = null,
        this.ksearch_msg = null
    }
    ,
    this.contactlist_select = function(n) {
        this.preview_timer && clearTimeout(this.preview_timer);
        var e, t, s = 0, a = !1, r = !1, i = !1, o = n.get_selection().length, l = this.env.source ? this.env.address_sources[this.env.source] : null;
        return this.env.contentframe && !n.multi_selecting && (e = n.get_single_selection()) ? this.preview_timer = setTimeout(function() {
            ref.load_contact(e, "show")
        }, this.preview_delay_click) : this.env.contentframe && this.show_contentframe(!1),
        o && (n.draggable = !1,
        this.env.selection_sources = [],
        l && this.env.selection_sources.push(this.env.source),
        $.each(n.get_selection(), function(e, t) {
            var s, i = n.data[t];
            l ? (a = a || !l.readonly && !i.readonly,
            r = r || !0 === l.deletable) : (t = (s = String(t).replace(/^[^-]+-/, "")) ? ref.env.address_sources[s] : null) && (a = a || !t.readonly && !i.readonly,
            r = r || !0 === t.deletable,
            ref.env.selection_sources.push(s)),
            "group" != i._type && (n.draggable = !0)
        }),
        this.env.selection_sources = $.unique(this.env.selection_sources),
        l && l.groups && $.each(this.env.contactgroups, function() {
            this.source === ref.env.source && s++
        }),
        t = $.map(this.env.address_sources, function(e, t) {
            return e.readonly ? null : t
        }),
        i = 0 < $.grep(t, function(e) {
            return jQuery.inArray(e, ref.env.selection_sources) < 0
        }).length),
        this.enable_command("group-assign-selected", 0 < s && a),
        this.enable_command("group-remove-selected", this.env.group && a),
        this.enable_command("print", "qrcode", 1 == o),
        this.enable_command("export-selected", 0 < o),
        this.enable_command("edit", e && a),
        this.enable_command("delete", "move", a || r),
        this.enable_command("copy", i),
        !1
    }
    ,
    this.list_contacts = function(e, t, s, i) {
        var n, a = -1, r = {}, o = void 0 === e && void 0 === t && void 0 === s, l = window;
        e = e || this.env.source,
        o && (t = this.env.group),
        e != this.env.source ? (s = this.env.current_page = 1,
        this.reset_qsearch()) : o || t == this.env.group || (s = this.env.current_page = 1),
        this.env.search_id ? n = "S" + this.env.search_id : this.env.search_request || (n = t ? "G" + e + t : e),
        this.env.source = this.env.last_source = e,
        this.env.group = this.env.last_group = t,
        $.each(this.env.address_group_stack, function(e, t) {
            if (ref.env.group == t.id)
                return a = e,
                !1
        }),
        this.env.address_group_stack = a < 0 ? [] : this.env.address_group_stack.slice(0, a),
        this.destroy_entity_selector("contactgroup-selector"),
        this.env.group ? ((i = i || {}).id = this.env.group,
        this.env.address_group_stack.push(i),
        n = "G" + e + this.env.address_group_stack[0].id) : this.gui_objects.addresslist_title && $(this.gui_objects.addresslist_title).text(this.get_label("contacts")),
        this.env.search_id || this.select_folder(n, "", !0),
        this.gui_objects.contactslist ? this.list_contacts_remote(e, t, s) : ((n = this.get_frame_window(this.env.contentframe)) && (l = n,
        r._framed = 1),
        t && (r._gid = t),
        s && (r._page = s),
        e && (r._source = e),
        this.env.search_request && (r._search = this.env.search_request),
        this.set_busy(!0, "loading"),
        this.location_href(r, l))
    }
    ,
    this.list_contacts_remote = function(e, t, s) {
        this.list_contacts_clear();
        var i = {}
          , n = this.set_busy(!0, "loading");
        e && (i._source = e),
        s && (i._page = s),
        t && (i._gid = t),
        this.env.source = e,
        this.env.group = t,
        this.env.search_request && (i._search = this.env.search_request),
        this.http_request("mail" == this.env.task ? "list-contacts" : "list", i, n),
        "mail" != this.env.task && this.update_state({
            _source: e,
            _page: s && 1 < s ? s : null,
            _gid: t
        })
    }
    ,
    this.list_contacts_clear = function() {
        this.contact_list.data = {},
        this.contact_list.clear(!0),
        this.show_contentframe(!1),
        this.enable_command("delete", "move", "copy", "print", !1)
    }
    ,
    this.set_group_prop = function(e) {
        var t, s;
        this.gui_objects.addresslist_title && (t = $(this.gui_objects.addresslist_title).html(""),
        (1 < this.env.address_group_stack.length || 1 == this.env.address_group_stack.length && this.env.address_group_stack[0].search_request) && (s = $('<a href="#list">...</a>').attr({
            title: this.get_label("uponelevel"),
            class: "poplink"
        }).click(function() {
            return ref.command("popgroup", "", this)
        }),
        t.append(s).append("&nbsp;&raquo;&nbsp;")),
        t.append($("<span>").text(e ? e.name : this.get_label("contacts"))))
    }
    ,
    this.load_contact = function(e, t, s) {
        var i, n = {}, a = window, r = this.contact_list ? this.contact_list.data[e] : null;
        if (i = this.get_frame_window(this.env.contentframe))
            n._framed = 1,
            a = i,
            this.show_contentframe(!0),
            e || this.contact_list.clear_selection(),
            this.enable_command("export-selected", "print", r && "group" != r._type);
        else if (s)
            return !1;
        return !t || !e && "add" != t || this.drag_active || (this.env.group && (n._gid = this.env.group),
        this.env.search_request && (n._search = this.env.search_request),
        e && (n._cid = this.preview_id = e),
        n._action = t,
        n._source = this.env.source,
        this.location_href(n, a, !0)),
        !0
    }
    ,
    this.group_member_change = function(e, t, s, i) {
        var n = this.display_message("add" == (e = "add" != e ? "del" : e) ? "addingmember" : "removingmember", "loading");
        this.http_post("group-" + e + "members", {
            _cid: t,
            _source: s,
            _gid: i
        }, n)
    }
    ,
    this.contacts_drag_menu = function(e, t) {
        var s = "group" == t.type ? t.source : t.id
          , i = this.env.source;
        if (!this.env.address_sources[s] || this.env.address_sources[s].readonly)
            return !0;
        if ("" == i && 1 == this.env.selection_sources.length && (i = this.env.selection_sources[0]),
        "group" != t.type || s != i)
            return this.commands.move || rcube_event.get_modifier(e) == SHIFT_KEY ? this.drag_menu(e, t) : (this.copy_contacts(t),
            !0);
        e = this.contact_list.get_selection().join(",");
        return this.group_member_change("add", e, s, t.id),
        !0
    }
    ,
    this.copy_contacts = function(e, t, s) {
        if (!e)
            return s = this.contact_list.get_selection(),
            this.addressbook_selector(t, function(e, t) {
                e = $(t).data("source") ? ref.env.contactgroups["G" + $(t).data("source") + $(t).data("gid")] : ref.env.address_sources[e];
                ref.copy_contacts(e, null, s)
            });
        var i, n, a = "group" == e.type ? e.source : e.id, r = this.env.source, t = this.env.group || "";
        (s = (s || this.contact_list.get_selection()).join(",")) && this.env.address_sources[a] && !this.env.address_sources[a].readonly && ("" == r && 1 == this.env.selection_sources.length && (r = this.env.selection_sources[0]),
        "group" == e.type ? a != r && (i = this.display_message("copyingcontact", "loading"),
        n = {
            _cid: s,
            _source: this.env.source,
            _to: a,
            _togid: e.id,
            _gid: t
        },
        this.http_post("copy", n, i)) : e.id != r && (i = this.display_message("copyingcontact", "loading"),
        n = {
            _cid: s,
            _source: this.env.source,
            _to: e.id,
            _gid: t
        },
        this.http_post("copy", n, i)))
    }
    ,
    this.move_contacts = function(e, t, s) {
        if (!e)
            return s = this.contact_list.get_selection(),
            this.addressbook_selector(t, function(e, t) {
                e = $(t).data("source") ? ref.env.contactgroups["G" + $(t).data("source") + $(t).data("gid")] : ref.env.address_sources[e];
                ref.move_contacts(e, null, s)
            });
        var i = "group" == e.type ? e.source : e.id
          , t = this.env.source;
        this.env.group;
        this.env.address_sources[i] && !this.env.address_sources[i].readonly && (s = s || this.contact_list.get_selection(),
        "" == t && 1 == this.env.selection_sources.length && (t = this.env.selection_sources[0]),
        "group" == e.type ? i != t && this._with_selected_contacts("move", {
            _to: i,
            _togid: e.id,
            _cid: s
        }) : e.id != t && this._with_selected_contacts("move", {
            _to: e.id,
            _cid: s
        }))
    }
    ,
    this.delete_contacts = function() {
        var e;
        this.env.source && this.env.address_sources[this.env.source].undelete ? this._with_selected_contacts("delete", {
            _cid: this.contact_list.get_selection()
        }) : (e = this.contact_list.get_selection(),
        this.confirm_dialog(this.get_label("deletecontactconfirm"), "delete", function() {
            ref._with_selected_contacts("delete", {
                _cid: e
            })
        }))
    }
    ,
    this._with_selected_contacts = function(e, t) {
        var s = t._cid;
        if (s.length || this.env.cid) {
            var i, n = [], a = this.display_message("delete" == e ? "contactdeleting" : "movingcontact", "loading"), r = this.check_display_next();
            if (this.env.cid)
                n.push(this.env.cid);
            else {
                for (i = 0; i < s.length; i++)
                    id = s[i],
                    n.push(id),
                    this.contact_list.remove_row(id, r && i == s.length - 1);
                r || this.contact_list.clear_selection()
            }
            return (t = t || {})._source = this.env.source,
            t._from = this.env.action,
            t._cid = n.join(","),
            this.env.group && (t._gid = this.env.group),
            this.env.search_request && (t._search = this.env.search_request),
            this.http_post(e, t, a),
            !0
        }
    }
    ,
    this.update_contact_row = function(e, t, s, i, n) {
        var a = this.contact_list;
        e = this.html_identifier(e),
        a.rows[e] || (e = e + "-" + i,
        s = s && s + "-" + i),
        a.update_row(e, t, s, !0),
        a.data[e] = n
    }
    ,
    this.add_contact_row = function(e, t, s, i) {
        if (!this.gui_objects.contactslist)
            return !1;
        var n, a, r = this.contact_list, o = {
            cols: []
        };
        for (n in o.id = "rcmrow" + this.html_identifier(e),
        o.className = "contact " + (s || ""),
        r.in_selection(e) && (o.className += " selected"),
        t)
            (a = {}).className = String(n).toLowerCase(),
            a.innerHTML = t[n],
            o.cols.push(a);
        r.data[e] = i,
        r.insert_row(o),
        this.enable_command("export", 0 < r.rowcount)
    }
    ,
    this.init_contact_form = function() {
        if (this.env.coltypes)
            for (var e in this.set_photo_actions($("#ff_photo").val()),
            this.env.coltypes)
                this.init_edit_field(e, null);
        $(".contactfieldgroup .row a.deletebutton").click(function() {
            return ref.delete_edit_field(this),
            !1
        }),
        $("select.addfieldmenu").change(function() {
            ref.insert_edit_field($(this).val(), $(this).attr("rel"), this),
            this.selectedIndex = 0
        }),
        $.datepicker && this.env.date_format && ($.datepicker.setDefaults({
            dateFormat: this.env.date_format,
            changeMonth: !0,
            changeYear: !0,
            yearRange: "-120:+10",
            showOtherMonths: !0,
            selectOtherMonths: !0
        }),
        $("input.datepicker").datepicker()),
        "search" == this.env.action && $(this.gui_objects.editform).append($('<input type="submit">').hide()).submit(function() {
            return $("input.mainaction").click(),
            !1
        })
    }
    ,
    this.group_create = function() {
        var t = $("<input>").attr({
            type: "text",
            "data-submit": "true"
        })
          , e = $("<label>").text(this.get_label("namex")).append(t)
          , s = this.env.source;
        this.simple_dialog(e, "newgroup", function() {
            var e;
            if (e = t.val())
                return ref.http_post("group-create", {
                    _source: s,
                    _name: e
                }, ref.set_busy(!0, "loading")),
                !0
        })
    }
    ,
    this.group_rename = function() {
        var t, s, e, i, n;
        this.env.group && (t = this.env.contactgroups["G" + this.env.source + this.env.group].name,
        s = $("<input>").attr({
            type: "text",
            "data-submit": "true"
        }).val(t),
        e = $("<label>").text(this.get_label("namex")).append(s),
        i = this.env.source,
        n = this.env.group,
        this.simple_dialog(e, "grouprename", function() {
            var e;
            if ((e = s.val()) && e != t)
                return ref.http_post("group-rename", {
                    _source: i,
                    _gid: n,
                    _name: e
                }, ref.set_busy(!0, "loading")),
                !0
        }))
    }
    ,
    this.group_delete = function() {
        var t;
        this.env.group && (t = this.env.group,
        this.confirm_dialog(this.get_label("deletegroupconfirm"), "delete", function() {
            var e = ref.set_busy(!0, "groupdeleting");
            ref.http_post("group-delete", {
                _source: ref.env.source,
                _gid: t
            }, e)
        }))
    }
    ,
    this.remove_group_item = function(e) {
        var t = "G" + e.source + e.id;
        this.treelist.remove(t) && (this.destroy_entity_selector("addressbook-selector"),
        this.destroy_entity_selector("contactgroup-selector"),
        this.triggerEvent("group_delete", {
            source: e.source,
            id: e.id
        }),
        delete this.env.contactfolders[t],
        delete this.env.contactgroups[t]),
        e.source == this.env.source && e.id == this.env.group && this.list_contacts(e.source, 0)
    }
    ,
    this.group_assign_selected = function(e, t, s) {
        var i = ref.contact_list.get_selection()
          , n = ref.env.source;
        this.contactgroup_selector(s, function(e) {
            ref.group_member_change("add", i, n, e)
        })
    }
    ,
    this.group_remove_selected = function() {
        this.http_post("group-delmembers", {
            _cid: this.contact_list.get_selection(),
            _source: this.env.source,
            _gid: this.env.group
        })
    }
    ,
    this.remove_group_contacts = function(e) {
        if (void 0 !== this.env.group && this.env.group === e.gid) {
            for (var t = this.contact_list.get_selection(), s = this.check_display_next(), i = 0; i < t.length; i++)
                id = t[i],
                this.contact_list.remove_row(id, s && i == t.length - 1);
            s || this.contact_list.clear_selection()
        }
    }
    ,
    this.insert_contact_group = function(e) {
        e.type = "group";
        var t = "G" + e.source + e.id
          , s = $("<a>").attr({
            href: "#",
            rel: e.source + ":" + e.id
        }).click(function() {
            return ref.command("listgroup", e, this)
        }).text(e.name);
        this.env.contactfolders[t] = this.env.contactgroups[t] = e,
        this.treelist.insert({
            id: t,
            html: s,
            classes: ["contactgroup"]
        }, e.source, "contactgroup"),
        this.destroy_entity_selector("addressbook-selector"),
        this.destroy_entity_selector("contactgroup-selector"),
        this.triggerEvent("group_insert", {
            id: e.id,
            source: e.source,
            name: e.name,
            li: this.treelist.get_item(t)
        })
    }
    ,
    this.update_contact_group = function(e) {
        var t, s, i = "G" + e.source + e.id, n = {};
        e.newid ? (t = "G" + e.source + e.newid,
        s = $.extend({}, e),
        this.env.contactfolders[t] = this.env.contactfolders[i],
        this.env.contactfolders[t].id = e.newid,
        this.env.group = e.newid,
        delete this.env.contactfolders[i],
        delete this.env.contactgroups[i],
        s.id = e.newid,
        s.type = "group",
        n.id = t,
        n.html = $("<a>").attr({
            href: "#",
            rel: e.source + ":" + e.newid
        }).click(function() {
            return ref.command("listgroup", s, this)
        }).text(e.name)) : ($(this.treelist.get_item(i)).children().first().text(e.name),
        this.env.contactfolders[i].name = this.env.contactgroups[i].name = e.name,
        e.source == this.env.source && e.id == this.env.group && this.set_group_prop(e)),
        this.treelist.update(i, n, !0),
        this.destroy_entity_selector("addressbook-selector"),
        this.destroy_entity_selector("contactgroup-selector"),
        this.triggerEvent("group_update", {
            id: e.id,
            source: e.source,
            name: e.name,
            li: this.treelist.get_item(i),
            newid: e.newid
        })
    }
    ,
    this.update_group_commands = function() {
        var e = "" != this.env.source ? this.env.address_sources[this.env.source] : null
          , e = e && e.groups && !e.readonly;
        this.enable_command("group-create", e),
        this.enable_command("group-rename", "group-delete", e && this.env.group)
    }
    ,
    this.init_edit_field = function(e, t) {
        var s = this.env.coltypes[e].label;
        t = t || $(".ff_" + e),
        s && !$('label[for="ff_' + e + '"]').length && t.placeholder(s)
    }
    ,
    this.insert_edit_field = function(e, t, s) {
        var i = $("#ff_" + e);
        if (i.length)
            $('label[for="ff_' + e + '"]').parent().show(),
            i.show().focus(),
            $(s).children('option[value="' + e + '"]').prop("disabled", !0);
        else {
            $(".ff_" + e);
            i = $("#contactsection" + t + " .contactcontroller" + e);
            if (i.length || (d = $("#contactsection" + t),
            h = $(".contactfieldgroup", d).last(),
            i = $("<fieldset>").addClass("contactfieldgroup contactcontroller" + e),
            h.length ? i.insertAfter(h) : d.prepend(i)),
            "FIELDSET" == i.get(0).nodeName) {
                var n, a, r, o = this.env.coltypes[e], l = 1 != o.limit ? "[]" : "", c = !!$(s).data("compact"), t = "ff_" + e + (o.count || 0), h = $("<div>").addClass("row input-group"), d = $("<div>").addClass("contactfieldcontent " + o.type);
                if (o.subtypes_select ? (n = $(o.subtypes_select),
                c ? n.addClass("input-group-prepend") : n = $("<div>").addClass("contactfieldlabel label").append(n)) : (n = $("<label>").addClass("contactfieldlabel label input-group-text").attr("for", t).text(o.label),
                c && (n = $('<span class="input-group-prepend">').append(n))),
                "text" == o.type || "date" == o.type)
                    a = $("<input>").addClass("form-control ff_" + e).attr({
                        type: "text",
                        name: "_" + e + l,
                        size: o.size,
                        id: t
                    }),
                    this.init_edit_field(e, a),
                    "date" == o.type && $.datepicker && a.addClass("datepicker").datepicker();
                else if ("textarea" == o.type)
                    a = $("<textarea>").addClass("form-control ff_" + e).attr({
                        name: "_" + e + l,
                        cols: o.size,
                        rows: o.rows,
                        id: t
                    }),
                    this.init_edit_field(e, a);
                else if ("composite" == o.type) {
                    var _, u, m, p, f, g = [], v = [], b = d;
                    if (h.addClass("composite"),
                    c && (b = $('<div class="content input-group-text">')),
                    f = this.env[e + "_template"])
                        for (_ = 0; _ < f.length; _++)
                            g.push(f[_][1]),
                            v.push(f[_][2]);
                    else
                        for (u in o.childs)
                            g.push(u);
                    for (_ = 0; _ < g.length; _++)
                        u = g[_],
                        m = o.childs[u],
                        a = $("<input>").addClass("form-control ff_" + u).attr({
                            type: "text",
                            name: "_" + u + l,
                            size: m.size
                        }).appendTo(b),
                        c || b.append(v[_] || " "),
                        this.init_edit_field(u, a),
                        p = p || a;
                    a = c ? b : p
                } else
                    "select" == o.type && ((r = (a = $("<select>").addClass("custom-select ff_" + e).attr({
                        name: "_" + e + l,
                        id: t
                    })).attr("options"))[r.length] = new Option("---",""),
                    o.options && $.each(o.options, function(e, t) {
                        r[r.length] = new Option(t,e)
                    }));
                a && (t = $('<a href="#del"></a>').addClass("contactfieldbutton deletebutton input-group-text icon delete").attr({
                    title: this.get_label("delete"),
                    rel: e
                }).html(this.env.delbutton).click(function() {
                    return ref.delete_edit_field(this),
                    !1
                }),
                h.append(n),
                c ? (h.append(a).append(t),
                t.wrap('<span class="input-group-append">')) : ("composite" != o.type && d.append(a),
                h.append(d.append(t))),
                h.appendTo(i.show()),
                (a.is("div") ? a.find("input") : a).first().focus(),
                o.count || (o.count = 0),
                ++o.count == o.limit && o.limit && $(s).children('option[value="' + e + '"]').prop("disabled", !0),
                this.triggerEvent("insert-edit-field", a))
            }
        }
    }
    ,
    this.delete_edit_field = function(e) {
        var t = $(e).attr("rel")
          , s = this.env.coltypes[t]
          , i = $(e).parents("div.row")
          , n = $(e).parents("fieldset.contactfieldgroup")
          , e = n.parent().find("select.addfieldmenu");
        --s.count <= 0 && s.visible ? i.find("input").val("").blur() : (i.remove(),
        n.children("div.row").length || n.hide()),
        e.length && ((n = e.children('option[value="' + t + '"]')).length ? n.prop("disabled", !1) : n = $("<option>").attr("value", t).html(s.label).appendTo(e),
        e.show())
    }
    ,
    this.upload_contact_photo = function(e) {
        e && e.elements._photo.value && (this.async_upload_form(e, "upload-photo", function(e) {
            ref.set_busy(!1, null, ref.file_upload_id)
        }),
        this.file_upload_id = this.set_busy(!0, "uploading"))
    }
    ,
    this.replace_contact_photo = function(e) {
        var t = "-del-" == e ? this.env.photo_placeholder : this.env.comm_path + "&_action=photo&_source=" + this.env.source + "&_cid=" + (this.env.cid || 0) + "&_photo=" + e;
        this.set_photo_actions(e),
        $(this.gui_objects.contactphoto).children("img").attr("src", t)
    }
    ,
    this.photo_upload_end = function() {
        this.set_busy(!1, null, this.file_upload_id),
        delete this.file_upload_id
    }
    ,
    this.set_photo_actions = function(e) {
        for (var t = this.buttons["upload-photo"], s = 0; t && s < t.length; s++)
            $("a#" + t[s].id).html(this.get_label("-del-" == e ? "addphoto" : "replacephoto"));
        $("#ff_photo").val(e),
        this.enable_command("upload-photo", !!this.env.coltypes.photo),
        this.enable_command("delete-photo", this.env.coltypes.photo && "-del-" != e)
    }
    ,
    this.advanced_search = function() {
        var s = $("<iframe>").attr("src", this.url("search", {
            _form: 1,
            _framed: 1
        }));
        return this.simple_dialog(s, "advsearch", function() {
            var e = !1
              , t = {
                _adv: 1
            };
            if ($.each($(s[0].contentWindow.rcmail.gui_objects.editform).serializeArray(), function() {
                this.name.match(/^_search/) && "" != this.value && (t[this.name] = this.value,
                e = !0)
            }),
            e)
                return ref.http_post("search", t, ref.set_busy(!0, "searching")),
                !0
        }, {
            button: "search",
            width: 600,
            height: 500
        }),
        !0
    }
    ,
    this.unselect_directory = function() {
        this.select_folder(""),
        this.enable_command("search-delete", !1)
    }
    ,
    this.insert_saved_search = function(e, t) {
        var s = "S" + t
          , i = $("<a>").attr({
            href: "#",
            rel: t
        }).click(function() {
            return ref.command("listsearch", t, this)
        }).html(e)
          , e = {
            name: e,
            id: t
        };
        this.savedsearchlist.insert({
            id: s,
            html: i,
            classes: ["contactsearch"]
        }, null, "contactsearch"),
        this.select_folder(s, "", !0),
        this.enable_command("search-delete", !0),
        this.env.search_id = t,
        this.triggerEvent("abook_search_insert", e)
    }
    ,
    this.search_create = function() {
        var t = $("<input>").attr("type", "text")
          , e = $("<label>").text(this.get_label("namex")).append(t);
        this.simple_dialog(e, "searchsave", function() {
            var e;
            if (e = t.val())
                return ref.http_post("search-create", {
                    _search: ref.env.search_request,
                    _name: e
                }, ref.set_busy(!0, "loading")),
                !0
        })
    }
    ,
    this.search_delete = function() {
        var e;
        this.env.search_request && (e = this.set_busy(!0, "savedsearchdeleting"),
        this.http_post("search-delete", {
            _sid: this.env.search_id
        }, e))
    }
    ,
    this.remove_search_item = function(e) {
        this.savedsearchlist.remove("S" + e) && this.triggerEvent("search_delete", {
            id: e
        }),
        this.env.search_id = null,
        this.env.search_request = null,
        this.list_contacts_clear(),
        this.reset_qsearch(),
        this.enable_command("search-delete", "search-create", !1)
    }
    ,
    this.listsearch = function(e) {
        var t = this.set_busy(!0, "searching");
        this.contact_list && this.list_contacts_clear(),
        this.reset_qsearch(),
        this.savedsearchlist ? (this.treelist.select(""),
        this.savedsearchlist.select("S" + e)) : this.select_folder("S" + e, "", !0),
        this.env.current_page = 1,
        this.http_request("search", {
            _sid: e
        }, t)
    }
    ,
    this.qrcode = function() {
        var e = new Image(300,300);
        return e.src = this.url("addressbook/qrcode", {
            _source: this.env.source,
            _cid: this.get_single_cid()
        }),
        this.simple_dialog(e, "qrcode", null, {
            button: !1,
            cancel_button: "close",
            width: 300,
            height: 300
        })
    }
    ,
    this.section_select = function(e) {
        var t, e = e.get_single_selection();
        e && (t = this.get_frame_window(this.env.contentframe)) && this.location_href({
            _action: "edit-prefs",
            _section: e,
            _framed: 1
        }, t, !0)
    }
    ,
    this.response_select = function(e) {
        e = e.get_single_selection();
        this.enable_command("delete", !!e && $.inArray(e, this.env.readonly_responses) < 0),
        e && this.load_response(e, "edit-response")
    }
    ,
    this.load_response = function(e, t) {
        var s;
        (s = this.get_frame_window(this.env.contentframe)) && (!e && "add-response" != t || (e || this.responses_list.clear_selection(),
        this.location_href({
            _action: t,
            _id: e,
            _framed: 1
        }, s, !0)))
    }
    ,
    this.identity_select = function(e) {
        var t = e.get_single_selection();
        this.enable_command("delete", !!t && 1 < e.rowcount && this.env.identities_level < 2),
        t && this.load_identity(t, "edit-identity")
    }
    ,
    this.load_identity = function(e, t) {
        var s;
        (s = this.get_frame_window(this.env.contentframe)) && (!e && "add-identity" != t || (e || this.identity_list.clear_selection(),
        this.location_href({
            _action: t,
            _iid: e,
            _framed: 1
        }, s, !0)))
    }
    ,
    this.delete_identity = function(e) {
        (e = !e && this.identity_list ? this.identity_list.get_single_selection() : e) && this.confirm_dialog(this.get_label("deleteidentityconfirm"), "delete", function() {
            ref.http_post("settings/delete-identity", {
                _iid: e
            }, !0)
        })
    }
    ,
    this.delete_response = function(e) {
        (e = !e && this.responses_list ? this.responses_list.get_single_selection() : e) && this.confirm_dialog(this.get_label("deleteresponseconfirm"), "delete", function() {
            ref.http_post("settings/delete-response", {
                _id: e
            }, !0)
        })
    }
    ,
    this.update_identity_row = function(e, t, s) {
        var i = this.identity_list
          , e = this.html_identifier(e);
        s ? (i.insert_row({
            id: "rcmrow" + e,
            cols: [{
                className: "mail",
                innerHTML: t
            }]
        }),
        i.select(e)) : i.update_row(e, [t])
    }
    ,
    this.update_response_row = function(e, t, s) {
        var i = this.responses_list;
        s ? (i.insert_row({
            id: "rcmrow" + e,
            cols: [{
                className: "name",
                innerHTML: t
            }]
        }),
        i.select(e)) : i.update_row(e, [t])
    }
    ,
    this.remove_response = function(e) {
        this.responses_list && (this.responses_list.remove_row(e),
        this.show_contentframe(!1)),
        this.enable_command("delete", !1)
    }
    ,
    this.remove_identity = function(e) {
        var t = this.identity_list
          , s = this.html_identifier(e);
        t && e && (t.remove_row(s),
        this.show_contentframe(!1)),
        this.enable_command("delete", !1)
    }
    ,
    this.init_subscription_list = function() {
        var e = RegExp.escape(this.env.delimiter);
        this.last_sub_rx = RegExp("[" + e + "]?[^" + e + "]+$"),
        this.subscription_list = new rcube_treelist_widget(this.gui_objects.subscriptionlist,{
            selectable: !0,
            tabexit: !1,
            parent_focus: !0,
            id_prefix: "rcmli",
            id_encode: this.html_identifier_encode,
            id_decode: this.html_identifier_decode,
            searchbox: "#foldersearch"
        }),
        this.subscription_list.addEventListener("select", function(e) {
            ref.subscription_select(e.id)
        }).addEventListener("collapse", function(e) {
            ref.folder_collapsed(e)
        }).addEventListener("expand", function(e) {
            ref.folder_collapsed(e)
        }).addEventListener("search", function(e) {
            e.query && ref.subscription_select()
        }).draggable({
            cancel: "li.mailbox.root,input,div.treetoggle,.custom-control"
        }).droppable({
            accept: function(e) {
                if (!e.is(".mailbox"))
                    return !1;
                var t = ref.folder_id2name(e.attr("id"))
                  , s = ref.folder_id2name(this.id)
                  , e = ref.env.subscriptionrows[t];
                ref.env.subscriptionrows[s];
                return e && !e[2] && s != t.replace(ref.last_sub_rx, "") && !s.startsWith(t + ref.env.delimiter)
            },
            drop: function(e, t) {
                var s = ref.folder_id2name(t.draggable.attr("id"))
                  , t = ref.folder_id2name(this.id);
                ref.subscription_move_folder(s, t)
            }
        })
    }
    ,
    this.folder_id2name = function(e) {
        return e ? ref.html_identifier_decode(e.replace(/^rcmli/, "")) : null
    }
    ,
    this.subscription_select = function(e) {
        var t;
        e && "*" != e && (t = this.env.subscriptionrows[e]) ? (this.env.mailbox = e,
        this.show_folder(e),
        this.enable_command("delete-folder", !t[2])) : (this.env.mailbox = null,
        this.show_contentframe(!1),
        this.enable_command("delete-folder", "purge", !1))
    }
    ,
    this.subscription_move_folder = function(e, t) {
        var s, i;
        e && null !== t && e != t && t != e.replace(this.last_sub_rx, "") && (s = e.split(this.env.delimiter).pop(),
        (i = "" === t || "*" === t ? s : t + this.env.delimiter + s) != e && this.confirm_dialog(this.get_label("movefolderconfirm"), "move", function() {
            ref.http_post("rename-folder", {
                _folder_oldname: e,
                _folder_newname: i
            }, ref.set_busy(!0, "foldermoving"))
        }, {
            button_class: "save move"
        }))
    }
    ,
    this.create_folder = function() {
        this.show_folder("", this.env.mailbox)
    }
    ,
    this.delete_folder = function(e) {
        (e = e || this.env.mailbox) && this.confirm_dialog(this.get_label("deletefolderconfirm"), "delete", function() {
            ref.http_post("delete-folder", {
                _mbox: e
            }, ref.set_busy(!0, "folderdeleting"))
        })
    }
    ,
    this.add_folder_row = function(e, t, s, i, n, a, r, o) {
        if (!this.gui_objects.subscriptionlist)
            return !1;
        this.subscription_list.is_search() && (this.subscription_select(),
        this.subscription_list.reset_search()),
        this.subscription_list.is_draggable() && this.subscription_list.draggable("destroy").droppable("destroy");
        var l, c, h, d, _, u, m = "", p = [], f = [], g = [], v = $(this.gui_objects.subscriptionlist), b = r || $($("li", v).get(1)).clone(!0);
        if (!b.length)
            return this.goto_url("folders"),
            !1;
        b.attr({
            id: "rcmli" + this.html_identifier_encode(e),
            class: a
        }),
        r && r.length || ($("ul,div.treetoggle", b).remove(),
        b.removeData("filtered")),
        $("a", b).first().text(s).removeAttr("title"),
        $('input[name="_subscribed[]"]', b).first().val(e).prop({
            checked: !!n,
            disabled: !!i
        }),
        this.env.subscriptionrows[e] = [t, s, !1],
        $.each(this.env.subscriptionrows, function(e, t) {
            t[3] = e,
            p.push(t)
        });
        try {
            _ = new Intl.Collator(this.env.locale.replace("_", "-"))
        } catch (e) {}
        for (l in p.sort(function(e, t) {
            for (var s, i, n = e[0].split(ref.env.delimiter), a = t[0].split(ref.env.delimiter), r = n.length, o = 0; o < r; o++) {
                if ((s = n[o]) !== (i = a[o]))
                    return void 0 === i ? 1 : _ ? _.compare(s, i) : s < i ? -1 : 1;
                if (o == r - 1)
                    return -1
            }
        }),
        p)
            u = p[l][3],
            p[l][2] ? (h = u + this.env.delimiter) != this.env.prefix_ns && (g.push(u),
            c = h) : c && u.startsWith(c) ? g.push(u) : (f.push(u),
            c = null);
        for (l = 0; l < g.length; l++)
            e.startsWith(g[l] + this.env.delimiter) && (d = g[l]);
        for (l = 0; !d && l < f.length; l++)
            l && f[l] == e && (d = f[l - 1]);
        if (d && (l = this.subscription_list.get_item(d, !0)))
            if ((s = e.lastIndexOf(this.env.delimiter)) && (m = e.substring(0, s),
            m = this.subscription_list.get_item(m, !0),
            $("div.treetoggle", m).length || $("<div>&nbsp;</div>").addClass("treetoggle collapsed").appendTo(m),
            $("ul", m).length || $("<ul>").css("display", "none").appendTo(m)),
            m && l == m)
                $("ul", m).first().append(b);
            else {
                for (; (u = $(l).parent().parent().get(0)) && (!m || u != m) && $(u).is("li.mailbox"); )
                    l = u;
                $(l).after(b)
            }
        else
            v.append(b);
        return $.extend(this.env.subscriptionrows, o || {}),
        this.subscription_list.reset(!0),
        this.subscription_select(),
        m && this.subscription_list.expand(this.folder_id2name(m.id)),
        (b = b.show().get(0)).scrollIntoView && b.scrollIntoView(!1),
        r || this.triggerEvent("clonerow", {
            row: b,
            id: e
        }),
        b
    }
    ,
    this.replace_folder_row = function(e, i, n, t, s, a) {
        if (!this.gui_objects.subscriptionlist)
            return !!this.is_framed() && window.parent.rcmail.replace_folder_row(e, i, n, t, s, a);
        this.subscription_list.is_search() && (this.subscription_select(),
        this.subscription_list.reset_search());
        var r = {}
          , o = this.subscription_list.get_item(e, !0)
          , l = $(o).parent()
          , c = this.env.subscriptionrows[e]
          , h = e.length
          , d = c[0].length
          , c = $('input[name="_subscribed[]"]', o).first().prop("checked");
        e != i ? ($("li", o).each(function() {
            var e = ref.folder_id2name(this.id)
              , t = ref.env.subscriptionrows[e]
              , s = i + e.slice(h);
            this.id = "rcmli" + ref.html_identifier_encode(s),
            $('input[name="_subscribed[]"]', this).first().val(s),
            t[0] = n + t[0].slice(d),
            r[s] = t,
            delete ref.env.subscriptionrows[e]
        }),
        o = $(o).detach(),
        delete this.env.subscriptionrows[e],
        l.get(0) == this.gui_objects.subscriptionlist || $("li", l).length || $("ul,div.treetoggle", l.parent()).remove(),
        this.add_folder_row(i, n, t, s, c, a, o, r)) : $(o).attr("class", a || "")
    }
    ,
    this.remove_folder_row = function(e) {
        this.subscription_list.is_search() && (this.subscription_select(),
        this.subscription_list.reset_search());
        var t = []
          , s = this.subscription_list.get_item(e, !0);
        $("li", s).each(function() {
            t.push(ref.folder_id2name(this.id))
        }),
        this.subscription_list.remove(e),
        t.push(e),
        $.each(t, function(e, t) {
            delete ref.env.subscriptionrows[t]
        })
    }
    ,
    this.subscribe = function(e) {
        this.change_subscription_state(e, !0)
    }
    ,
    this.unsubscribe = function(e) {
        this.change_subscription_state(e, !1)
    }
    ,
    this.change_subscription_state = function(e, t) {
        var s, i;
        e && (i = this.display_message("folder" + (s = t ? "" : "un") + "subscribing", "loading"),
        this.http_post(s + "subscribe", {
            _mbox: e
        }, i),
        $(this.gui_objects.subscriptionlist).find('input[value="' + e + '"]').prop("checked", t))
    }
    ,
    this.show_folder = function(e, t, s) {
        var i = window
          , e = "&_action=" + ("" === e ? "add" : "edit") + "-folder&_mbox=" + urlencode(e);
        t && (e += "&_path=" + urlencode(t)),
        (t = this.get_frame_window(this.env.contentframe)) && (i = t,
        e += "&_framed=1"),
        0 <= String(i.location.href).indexOf(e) && !s ? this.show_contentframe(!0) : this.location_href(this.env.comm_path + e, i, !0)
    }
    ,
    this.disable_subscription = function(e) {
        e = this.subscription_list.get_item(e, !0);
        e && $('input[name="_subscribed[]"]', e).first().prop("disabled", !0)
    }
    ,
    this.reset_subscription = function(e, t) {
        e = this.subscription_list.get_item(e, !0);
        e && $('input[name="_subscribed[]"]', e).first().prop("checked", t)
    }
    ,
    this.folder_size = function(e) {
        var t = this.set_busy(!0, "loading");
        this.http_post("folder-size", {
            _mbox: e
        }, t)
    }
    ,
    this.folder_size_update = function(e) {
        $("#folder-size").replaceWith(e)
    }
    ,
    this.folder_filter = function(s) {
        this.subscription_list.reset_search(),
        this.subscription_list.container.children("li").each(function() {
            var e, t = ref.folder_id2name(this.id);
            if ("---" != s)
                if (s) {
                    if (t !== s)
                        return void $(this).data("filtered", !0).hide()
                } else
                    for (e in ref.env.ns_roots)
                        if (t === ref.env.ns_roots[e])
                            return void $(this).data("filtered", !0).hide();
            $(this).removeData("filtered").show()
        })
    }
    ,
    this.init_button = function(e, t) {
        var s, i = document.getElementById(t.id);
        i && (s = !1,
        "image" == t.type && (i = i.parentNode,
        s = !0),
        i._command = e,
        i._id = t.id,
        t.sel && (i.onmousedown = function(e) {
            return ref.button_sel(this._command, this._id)
        }
        ,
        i.onmouseup = function(e) {
            return ref.button_out(this._command, this._id)
        }
        ,
        s && ((new Image).src = t.sel)),
        t.over && (i.onmouseover = function(e) {
            return ref.button_over(this._command, this._id)
        }
        ,
        i.onmouseout = function(e) {
            return ref.button_out(this._command, this._id)
        }
        ,
        s && ((new Image).src = t.over)))
    }
    ,
    this.init_buttons = function() {
        for (var e in this.buttons)
            if ("string" == typeof e)
                for (var t = 0; t < this.buttons[e].length; t++)
                    this.init_button(e, this.buttons[e][t])
    }
    ,
    this.set_button = function(e, t) {
        for (var s, i, n = this.buttons[e], a = n ? n.length : 0, r = 0; r < a; r++)
            s = n[r],
            (i = document.getElementById(s.id)) && s.status !== t && ("image" != s.type || s.status ? s.status || (s.pas = String(i.className)) : (s.pas = i._original_src || i.src,
            i.runtimeStyle && i.runtimeStyle.filter && i.runtimeStyle.filter.match(/src=['"]([^'"]+)['"]/) && (s.pas = RegExp.$1)),
            s.status = t,
            "image" == s.type && s[t] ? i.src = s[t] : void 0 !== s[t] && (i.className = s[t]),
            "input" == s.type || "button" == s.type ? i.disabled = "pas" == t : $(i).attr({
                tabindex: "pas" == t || "sel" == t ? "-1" : $(i).attr("data-tabindex") || "0",
                "aria-disabled": "pas" == t || "sel" == t ? "true" : "false"
            }))
    }
    ,
    this.set_alttext = function(e, t) {
        for (var s, i, n = this.buttons[e], a = n ? n.length : 0, r = 0; r < a; r++)
            i = n[r],
            s = document.getElementById(i.id),
            t = this.get_label(t),
            s && "image" == i.type ? (s.setAttribute("alt", t),
            (i = s.parentNode) && "a" == i.tagName.toLowerCase() && i.setAttribute("title", t)) : s && s.setAttribute("title", t)
    }
    ,
    this.button_over = function(e, t) {
        this.button_event(e, t, "over")
    }
    ,
    this.button_sel = function(e, t) {
        this.button_event(e, t, "sel")
    }
    ,
    this.button_out = function(e, t) {
        this.button_event(e, t, "act")
    }
    ,
    this.button_event = function(e, t, s) {
        for (var i, n, a = this.buttons[e], r = a ? a.length : 0, o = 0; o < r; o++)
            (i = a[o]).id == t && "act" == i.status && (i[s] && (n = document.getElementById(i.id)) && (n["image" == i.type ? "src" : "className"] = i[s]),
            "sel" == s && (this.buttons_sel[t] = e))
    }
    ,
    this.set_pagetitle = function(e) {
        e && document.title && (document.title = e)
    }
    ,
    this.display_message = function(e, t, s, i) {
        if (e && e.length && /^[a-z._]+$/.test(e) && (e = this.get_label(e)),
        this.is_framed())
            return parent.rcmail.display_message(e, t, s);
        if (!this.gui_objects.message)
            return "loading" != t && (this.pending_message = [e, t, s, i]),
            1;
        t ? "loading" == t && (i = i || "loading",
        s = s || 1e3 * this.env.request_timeout,
        e = e || this.get_label("loading")) : t = "notice",
        i = i || this.html_identifier(e);
        var n = new Date
          , a = t + n.getTime();
        if (!s)
            switch (t) {
            case "error":
            case "warning":
                s = 2 * this.message_time;
                break;
            case "uploading":
                s = 0;
                break;
            default:
                s = this.message_time
            }
        if (this.messages[i])
            return this.messages[i].obj && $("div.content", this.messages[i].obj).html(e),
            "loading" == t && this.messages[i].labels.push({
                id: a,
                msg: e
            }),
            this.messages[i].elements.push(a),
            setTimeout(function() {
                ref.hide_message(a, "loading" == t)
            }, s),
            a;
        var r = $("<div>").addClass(t + " content").html(e).data("key", i);
        $(this.gui_objects.message).append(r).show();
        return this.messages[i] = {
            obj: r,
            elements: [a]
        },
        "loading" == t ? this.messages[i].labels = [{
            id: a,
            msg: e
        }] : "uploading" != t && r.click(function() {
            return ref.hide_message(r)
        }).attr("role", "alert"),
        this.triggerEvent("message", {
            message: e,
            type: t,
            timeout: s,
            object: r
        }),
        0 < s && setTimeout(function() {
            ref.hide_message(a, "loading" != t)
        }, s),
        a
    }
    ,
    this.hide_message = function(e, t) {
        if (this.is_framed())
            return parent.rcmail.hide_message(e, t);
        if (this.gui_objects.message) {
            var s, i, n, a, r = this.messages;
            if ("object" == typeof e)
                s = (a = $(e)).data("key"),
                this.hide_message_object(a, t),
                r[s] && delete r[s];
            else
                for (s in r)
                    for (i in r[s].elements)
                        if (r[s] && r[s].elements[i] == e)
                            if (r[s].elements.splice(i, 1),
                            r[s].elements.length) {
                                if ("loading" == s)
                                    for (n in r[s].labels)
                                        r[s].labels[n].id == e ? delete r[s].labels[n] : (a = r[s].labels[n].msg,
                                        $("div.content", r[s].obj).html(a))
                            } else
                                this.hide_message_object(r[s].obj, t),
                                delete r[s]
        }
    }
    ,
    this.hide_message_object = function(e, t) {
        t ? e.fadeOut(600, function() {
            $(this).remove()
        }) : e.hide().remove()
    }
    ,
    this.clear_messages = function() {
        if (this.is_framed())
            return parent.rcmail.clear_messages();
        var e, t, s = this.messages;
        for (e in s)
            for (t in s[e].elements)
                s[e].obj && this.hide_message_object(s[e].obj);
        this.messages = {}
    }
    ,
    this.display_progress = function(e) {
        var t;
        e && e.name && (t = this.messages["progress" + e.name],
        e.label || (e.label = this.get_label("uploadingmany")),
        t ? !e.total || 100 <= e.percent ? this.hide_message(t.obj) : (e.text && (e.label += " " + e.text),
        t.obj.text(e.label)) : (!e.percent || e.percent < 100) && this.display_message(e.label, "uploading", 0, "progress" + e.name))
    }
    ,
    this.show_popup_dialog = function(e, t, i, n) {
        if (this.is_framed())
            return parent.rcmail.show_popup_dialog(e, t, i, n);
        var s = $('<div class="popup">');
        "object" == typeof e ? (s.append(e),
        $(e).is("iframe") && s.addClass("iframe")) : s.html(e);
        var a = 0;
        n && n.button_classes && $.each(i, function(e, t) {
            var s = n.button_classes[a];
            s && (i[e] = (s = s,
            e = e,
            "function" == typeof (t = t) ? t = {
                click: t,
                text: e,
                class: s
            } : i.class = s,
            t)),
            a++
        }),
        n = $.extend({
            title: t,
            buttons: i,
            modal: !0,
            resizable: !0,
            width: 500,
            close: function(e, t) {
                $(this).remove()
            }
        }, n || {}),
        s.dialog(n),
        s[0].jqref = $,
        n.width && s.width(n.width),
        n.height && s.height(n.height);
        var r, o, l, c, h, d = s.parent();
        return n.noresize ? s.css("width", "auto") : (r = (h = $(window)).width(),
        o = h.height(),
        l = s.width(),
        c = n.height || s[0].scrollHeight + 20,
        e = $(".ui-dialog-titlebar", d).outerHeight() || 0,
        t = $(".ui-dialog-buttonpane", d).outerHeight() || 0,
        h = 2 * (parseInt(d.css("padding-top")) + parseInt(s.css("padding-top"))),
        s.dialog("option", {
            height: Math.min(o - 40, c + e + t + h + 2),
            width: Math.min(r - 20, l + 28)
        })),
        d.on("keydown keyup", function(e) {
            e.stopPropagation()
        }),
        d.find("input[data-submit]").on("keydown", function(e) {
            13 == e.which && d.find(".ui-dialog-buttonpane button.mainaction").click()
        }),
        this.triggerEvent("dialog-open", {
            obj: s
        }),
        s
    }
    ,
    this.simple_dialog = function(e, t, s, i) {
        i = i || {};
        function n(e, t, s) {
            (s = s || this).jqref(s).dialog("close"),
            i.cancel_func && i.cancel_func(e, ref)
        }
        var t = this.get_label(t)
          , a = i.button || "save"
          , r = i.button_class || a.replace(/^[^\.]+\./i, "")
          , o = i.cancel_button || "cancel"
          , l = i.cancel_class || o.replace(/^[^\.]+\./i, "")
          , l = [{
            text: this.get_label(o),
            class: l.replace(/close/i, "cancel"),
            click: n
        }];
        return s ? l.unshift({
            text: this.get_label(a),
            class: "mainaction " + r,
            click: function(e, t) {
                s(e, ref) && n(e, 0, this)
            }
        }) : l[0].class += " mainaction",
        this.show_popup_dialog(e, t, l, i)
    }
    ,
    this.alert_dialog = function(e, t, s) {
        return s = $.extend(s || {}, {
            cancel_button: "ok",
            cancel_class: "save",
            cancel_func: t,
            noresize: !0
        }),
        this.simple_dialog(e, s.title || "alerttitle", null, s)
    }
    ,
    this.confirm_dialog = function(e, t, s, i) {
        return i = $.extend(i || {}, {
            button: t || "continue",
            noresize: !0
        }),
        this.simple_dialog(e, i.title || "confirmationtitle", function(e, t) {
            return s(e, t),
            !0
        }, i)
    }
    ,
    this.set_page_buttons = function() {
        this.enable_command("nextpage", "lastpage", this.env.pagecount > this.env.current_page),
        this.enable_command("previouspage", "firstpage", 1 < this.env.current_page),
        this.update_pagejumper()
    }
    ,
    this.select_folder = function(e, t, s) {
        this.savedsearchlist && this.savedsearchlist.select(""),
        this.treelist ? this.treelist.select(e) : this.gui_objects.folderlist && ($("li.selected", this.gui_objects.folderlist).removeClass("selected"),
        $(this.get_folder_li(e, t, s)).addClass("selected"),
        this.triggerEvent("selectfolder", {
            folder: e,
            prefix: t
        }))
    }
    ,
    this.mark_folder = function(e, t, s, i) {
        $(this.get_folder_li(e, s, i)).addClass(t),
        this.triggerEvent("markfolder", {
            folder: e,
            mark: t,
            status: !0
        })
    }
    ,
    this.unmark_folder = function(e, t, s, i) {
        $(this.get_folder_li(e, s, i)).removeClass(t),
        this.triggerEvent("markfolder", {
            folder: e,
            mark: t,
            status: !1
        })
    }
    ,
    this.get_folder_li = function(e, t, s) {
        if (t = t || "rcmli",
        this.gui_objects.folderlist)
            return e = this.html_identifier(e, s),
            document.getElementById(t + e)
    }
    ,
    this.set_message_coltypes = function(e, t, s) {
        this.env.listcols = e,
        this.msglist_setup(this.env.layout);
        var i, n, a, r, o, l, c = this.message_list, h = c ? c.thead : null, d = this.env.msglist_cols;
        if (this.env.coltypes || (this.env.coltypes = {}),
        h) {
            if (t) {
                for (r in h.innerHTML = "",
                l = document.createElement("tr"),
                d)
                    a = d[r],
                    (i = document.createElement("th")).innerHTML = t[a].html || "",
                    t[a].id && (i.id = t[a].id),
                    t[a].className && (i.className = t[a].className),
                    l.appendChild(i);
                c.checkbox_selection && c.insert_checkbox(l, "thead"),
                h.appendChild(l)
            }
            for (r = 0,
            o = d.length; r < o; r++)
                n = d[c.checkbox_selection ? r - 1 : r],
                !(i = h.rows[0].cells[r]) || "from" != n && "to" != n && "fromto" != n || $(i).attr("rel", n).find("span,a").text(this.get_label("fromto" == n ? s : n))
        }
        this.env.subject_col = null,
        this.env.flagged_col = null,
        this.env.status_col = null,
        this.env.coltypes.folder && (this.env.coltypes.folder.hidden = !(this.env.search_request || this.env.search_id) || "base" == this.env.search_scope),
        0 <= (r = $.inArray("subject", d)) && (this.env.subject_col = r,
        c && (c.subject_col = r)),
        0 <= (r = $.inArray("flag", d)) && (this.env.flagged_col = r),
        0 <= (r = $.inArray("status", d)) && (this.env.status_col = r),
        c && (c.hide_column("folder", this.env.coltypes.folder && this.env.coltypes.folder.hidden || $.inArray("folder", d) < 0),
        c.init_header())
    }
    ,
    this.set_rowcount = function(e, t) {
        if (t && t != this.env.mailbox)
            return !1;
        $(this.gui_objects.countdisplay).html(e),
        this.set_page_buttons()
    }
    ,
    this.set_mailboxname = function(e) {
        this.gui_objects.mailboxname && e && (this.gui_objects.mailboxname.innerHTML = e)
    }
    ,
    this.set_quota = function(e) {
        this.gui_objects.quotadisplay && e && "text" == e.type && $(this.gui_objects.quotadisplay).text((e.percent || 0) + "%").attr("title", e.title || ""),
        this.triggerEvent("setquota", e),
        this.env.quota_content = e
    }
    ,
    this.set_trash_count = function(e) {
        this[(e ? "un" : "") + "mark_folder"](this.env.trash_mailbox, "empty", "", !0)
    }
    ,
    this.set_unread_count = function(e, t, s, i) {
        if (!this.gui_objects.mailboxlist)
            return !1;
        this.env.unread_counts[e] = t,
        this.set_unread_count_display(e, s),
        i ? this.mark_folder(e, i, "", !0) : t || this.unmark_folder(e, "recent", "", !0),
        this.mark_all_read_state()
    }
    ,
    this.set_unread_count_display = function(e, t) {
        var s, i, n, a, r, o;
        if (o = this.get_folder_li(e, "", !0)) {
            if (n = this.env.unread_counts[e] || 0,
            !(i = (r = $(o).children("a").eq(0)).children("span.unreadcount")).length && n && (i = $("<span>").addClass("unreadcount skip-content").appendTo(r)),
            s = /\s+\([0-9]+\)$/i,
            a = 0,
            (r = o.getElementsByTagName("div")[0]) && r.className.match(/collapsed/))
                for (var l in this.env.unread_counts)
                    l.startsWith(e + this.env.delimiter) && (a += this.env.unread_counts[l]);
            n && i.length ? i.html(this.env.unreadwrap.replace(/%[sd]/, n)) : i.length && i.remove(),
            s = new RegExp(RegExp.escape(this.env.delimiter) + "[^" + RegExp.escape(this.env.delimiter) + "]+$"),
            e.match(s) && this.set_unread_count_display(e.replace(s, ""), !1),
            0 < n + a ? $(o).addClass("unread") : $(o).removeClass("unread")
        }
        s = /^\([0-9]+\)\s+/i,
        t && document.title && (o = "",
        t = String(document.title),
        o = n && t.match(s) ? t.replace(s, "(" + n + ") ") : n ? "(" + n + ") " + t : t.replace(s, ""),
        this.set_pagetitle(o))
    }
    ,
    this.set_headers = function(e) {
        this.gui_objects.all_headers_box && e && $(this.gui_objects.all_headers_box).html(e).show()
    }
    ,
    this.show_headers = function(e, t) {
        this.gui_objects.all_headers_row && this.gui_objects.all_headers_box && this.env.uid && ($(t).removeClass("show-headers").addClass("hide-headers"),
        $(this.gui_objects.all_headers_row).show(),
        t.onclick = function() {
            ref.command("hide-headers", "", t)
        }
        ,
        this.gui_objects.all_headers_box.innerHTML || this.http_request("headers", {
            _uid: this.env.uid,
            _mbox: this.env.mailbox
        }, this.display_message("", "loading")))
    }
    ,
    this.hide_headers = function(e, t) {
        this.gui_objects.all_headers_row && this.gui_objects.all_headers_box && ($(t).removeClass("hide-headers").addClass("show-headers"),
        $(this.gui_objects.all_headers_row).hide(),
        t.onclick = function() {
            ref.command("show-headers", "", t)
        }
        )
    }
    ,
    this.folder_selector = function(e, t) {
        this.entity_selector("folder-selector", t, this.env.mailboxes_list, function(e, t) {
            var s = 0
              , i = 0
              , n = ref.env.delimiter
              , a = ref.env.mailboxes[e]
              , r = a.id
              , e = $("<li>");
            for (a.virtual ? t.addClass("virtual").attr({
                "aria-disabled": "true",
                tabindex: "-1"
            }) : t.addClass("active").data("id", a.id),
            a.class && e.addClass(a.class); 0 <= (i = r.indexOf(n, i)); )
                s++,
                i++;
            return t.css("padding-left", s ? 16 * s + "px" : 0),
            t.append($("<span>").text(a.name)),
            e.append(t)
        }, e)
    }
    ,
    this.addressbook_selector = function(e, t) {
        var s = [];
        this.entity_selectors["addressbook-selector"] || $.each(this.env.address_sources, function() {
            var e;
            this.readonly || (s.push(e = this),
            $.each(ref.env.contactgroups, function() {
                e.id === this.source && s.push(this)
            }))
        }),
        this.entity_selector("addressbook-selector", t, s, function(e, t) {
            return "group" == e.type ? t.attr("rel", e.source + ":" + e.id).addClass("contactgroup active").data({
                source: e.source,
                gid: e.id,
                id: e.source + ":" + e.id
            }).css("padding-left", "16px") : t.addClass("addressbook active").data("id", e.id),
            t.append($("<span>").text(e.name)),
            $("<li>").append(t)
        }, e)
    }
    ,
    this.contactgroup_selector = function(e, t) {
        this.entity_selector("contactgroup-selector", t, this.env.contactgroups, function(e, t) {
            if (ref.env.source === e.source)
                return t.addClass("contactgroup active").data({
                    id: e.id
                }).append($("<span>").text(e.name)),
                $("<li>").append(t)
        }, e)
    }
    ,
    this.entity_selector = function(e, t, s, i, n) {
        var a, r, o, l = this.entity_selectors[e];
        l || (a = [],
        l = $("<div>").attr("id", e).addClass("popupmenu"),
        r = $("<ul>").addClass("toolbarmenu menu"),
        (o = document.createElement("a")).href = "#",
        o.className = "icon",
        $.each(s, function(e) {
            var t = $(o.cloneNode(!1)).attr("rel", this.id);
            a.push(i(this, t, e))
        }),
        r.append(a).appendTo(l),
        l.css({
            left: "-1000px",
            top: "-1000px"
        }).appendTo(document.body).show(),
        10 < a.length && l.css("max-height", 10 * $("li", l)[0].offsetHeight + 9),
        l.on("click", "a.active", function(e) {
            l.data("callback")($(this).data("id"), this)
        }),
        this.entity_selectors[e] = l),
        l.data("callback", t),
        this.show_menu(e, !0, n)
    }
    ,
    this.destroy_entity_selector = function(e) {
        $("#" + e).remove(),
        delete this.entity_selectors[e],
        this.triggerEvent("destroy-entity-selector", {
            name: e
        })
    }
    ,
    this.show_menu = function(e, t, s) {
        var i, n, a, r = "object" == typeof e ? e.menu : e, o = $("#" + r), l = s && s.target ? $(s.target) : $(o.attr("rel") || "#" + r + "link"), c = rcube_event.is_keyboard(s), h = o.attr("data-align") || "", d = !1;
        if ("A" != l.get(0).tagName && l.closest("a").length && (l = l.closest("a")),
        "string" == typeof e && (e = {
            menu: r
        }),
        !(o = !o.length ? this.triggerEvent("menu-get", {
            name: r,
            props: e,
            originalEvent: s
        }) : o) || !o.length)
            return this.triggerEvent(!1 === t ? "menu-close" : "menu-open", {
                name: r,
                props: e,
                originalEvent: s
            });
        if (o.appendTo(document.body),
        (t = void 0 === t ? !o.is(":visible") : t) && l.length && (i = $(window),
        n = l.offset(),
        a = 0 <= h.indexOf("bottom"),
        d = "menuitem" == l.attr("role") || 0 < l.closest("[role=menuitem]").length,
        l.offsetWidth = l.outerWidth(),
        l.offsetHeight = l.outerHeight(),
        !a && n.top + l.offsetHeight + o.height() > i.height() && (a = !0),
        0 <= h.indexOf("right") ? n.left = n.left + l.outerWidth() - o.width() : d && (n.left = n.left + l.offsetWidth - 5,
        n.top -= l.offsetHeight),
        n.left + o.width() > i.width() && (n.left = i.width() - o.width() - 12),
        n.top = Math.max(0, n.top + (a ? -o.height() : l.offsetHeight)),
        o.css({
            left: n.left + "px",
            top: n.top + "px"
        })),
        t) {
            for (var _ = this.menu_stack.length - 1; d && 0 <= _; _--)
                $(l).parents("#" + this.menu_stack[_]).length || "menuitem" == $(s.target).parent().attr("role") || this.hide_menu(this.menu_stack[_], s);
            d && this.menu_stack.length ? (o.data("parent", $.last(this.menu_stack)),
            o.css("z-index", ($("#" + $.last(this.menu_stack)).css("z-index") || 0) + 1)) : !d && this.menu_stack.length && this.hide_menu(this.menu_stack[0], s),
            o.show().attr("aria-hidden", "false").data("opener", l.attr("aria-expanded", "true").get(0)),
            this.triggerEvent("menu-open", {
                name: r,
                obj: o,
                props: e,
                originalEvent: s
            }),
            this.menu_stack.push(r),
            this.menu_keyboard_active = t && c,
            this.menu_keyboard_active && (this.focused_menu = r,
            o.find("a,input:not(:disabled)").not("[aria-disabled=true]").first().focus())
        } else
            this.hide_menu(r, s);
        return t
    }
    ,
    this.hide_menu = function(e, t) {
        if (this.menu_stack.length) {
            for (var s, i = rcube_event.is_keyboard(t), n = this.menu_stack.length - 1; 0 <= n; n--)
                s = $("#" + this.menu_stack[n]).hide().attr("aria-hidden", "true").data("parent", !1),
                this.triggerEvent("menu-close", {
                    name: this.menu_stack[n],
                    obj: s,
                    props: {
                        menu: this.menu_stack[n]
                    },
                    originalEvent: t
                }),
                this.menu_stack[n] == e && (n = -1,
                s.data("opener") && ($(s.data("opener")).attr("aria-expanded", "false"),
                i && s.data("opener").focus())),
                this.menu_stack.pop();
            this.menu_stack.length && i ? (this.menu_keyboard_active = !0,
            this.focused_menu = $.last(this.menu_stack),
            s && s.data("opener") || $("#" + this.focused_menu).find("a,input:not(:disabled)").not("[aria-disabled=true]").first().focus()) : (this.focused_menu = null,
            this.menu_keyboard_active = !1)
        } else
            this.triggerEvent("menu-close", {
                name: e,
                props: {
                    menu: e
                },
                originalEvent: t
            })
    }
    ,
    this.element_position = function(e, t) {
        var t = $(t)
          , s = $(window)
          , i = t.outerWidth()
          , n = t.outerHeight()
          , a = t.data("menu-pos")
          , r = s.height()
          , o = $(e).height()
          , l = $(e).width()
          , c = t.offset()
          , t = c.top
          , c = c.left + i;
        "bottom" == a ? (t += n,
        c -= i) : c -= 5,
        r < t + o && (t -= o - n) < 0 && (t = Math.max(0, (r - o) / 2)),
        c + l > s.width() && (c -= l + i),
        e.css({
            left: c + "px",
            top: t + "px"
        })
    }
    ,
    this.editor_init = function(e, t) {
        this.editor = new rcube_text_editor(e || this.env.editor_config,t)
    }
    ,
    this.html2plain = function(e, t) {
        return this.format_converter(e, "html", t)
    }
    ,
    this.plain2html = function(e, t) {
        return this.format_converter(e, "plain", t)
    }
    ,
    this.format_converter = function(e, t, s) {
        if (!e || "html" == t && !e.replace(/<[^>]+>|&nbsp;|\xC2\xA0|\s/g, "").length || "html" != t && !e.replace(/\xC2\xA0|\s/g, "").length)
            return s && setTimeout(function() {
                s("")
            }, 50),
            !0;
        var i = this.env.editor_warned || confirm(this.get_label("editorwarning"));
        if (this.env.editor_warned = !0,
        !i)
            return !1;
        var t = "?_task=utils&_action=" + ("html" == t ? "html2text" : "text2html")
          , n = this.set_busy(!0, "converting");
        return $.ajax({
            type: "POST",
            url: t,
            data: e,
            contentType: "application/octet-stream",
            error: function(e, t, s) {
                ref.http_error(e, t, s, n)
            },
            success: function(e) {
                ref.set_busy(!1, null, n),
                s && s(e)
            }
        }),
        !0
    }
    ,
    this.url = function(e, t) {
        var s = "string" == typeof t ? t : "";
        "string" != typeof e ? t = e : t && "object" == typeof t || (t = {}),
        e ? t._action = e : this.env.action && (t._action = this.env.action);
        var i, n = this.env.comm_path, a = {};
        for (i in e && e.match(/([a-z0-9_-]+)\/([a-z0-9-_.]+)/) && (t._action = RegExp.$2,
        n = n.replace(/\_task=[a-z0-9_-]+/, "_task=" + RegExp.$1)),
        0 === t._framed && (n = n.replace("&_framed=1", ""),
        t._framed = null),
        t)
            void 0 !== t[i] && null !== t[i] && (a[i] = t[i]);
        return (a = $.param(a)) && (n += (-1 < n.indexOf("?") ? "&" : "?") + a),
        s && (n += (-1 < n.indexOf("?") ? "&" : "?") + s),
        n
    }
    ,
    this.redirect = function(e, t) {
        !1 !== t && this.set_busy(!0, "loading"),
        this.is_framed() ? (e = e.replace(/&_framed=1/, ""),
        parent.rcmail.redirect(e, t)) : (this.env.extwin && ("string" == typeof e ? e += (e.indexOf("?") < 0 ? "?" : "&") + "_extwin=1" : e._extwin = 1),
        this.location_href(e, window))
    }
    ,
    this.goto_url = function(e, t, s, i) {
        t = this.url(e, t);
        i && (t = this.secure_url(t)),
        this.redirect(t, s)
    }
    ,
    this.location_href = function(e, t, s) {
        s && this.lock_frame(t),
        "object" == typeof e && (e = this.env.comm_path + "&" + $.param(e)),
        bw.ie && t == window ? $("<a>").attr("href", e).appendTo(document.body).get(0).click() : t.location.href = e,
        this.start_keepalive()
    }
    ,
    this.update_state = function(e) {
        if (window.history.replaceState)
            try {
                window.history.replaceState({}, document.title, rcmail.url("", e))
            } catch (e) {}
    }
    ,
    this.http_request = function(i, e, n, t) {
        "POST" != t && (t = "GET"),
        (e = "object" != typeof e ? rcube_parse_query(e) : e)._remote = 1,
        e._unlock = n || 0;
        var s = this.triggerEvent("request" + i, e);
        if (!1 === s)
            return e._unlock && this.set_busy(!1, null, e._unlock),
            !1;
        if (s && s.getResponseHeader)
            return s;
        void 0 !== s && (e = s)._action && (i = e._action,
        delete e._action);
        s = this.url(i);
        return this.start_keepalive(),
        $.ajax({
            type: t,
            url: s,
            data: e,
            dataType: "json",
            success: function(e) {
                ref.http_response(e)
            },
            error: function(e, t, s) {
                ref.http_error(e, t, s, n, i)
            }
        })
    }
    ,
    this.http_get = this.http_request,
    this.http_post = function(e, t, s) {
        return this.http_request(e, t, s, "POST")
    }
    ,
    this.abort_request = function(e) {
        e.request && e.request.abort(),
        e.lock && this.set_busy(!1, null, e.lock)
    }
    ,
    this.http_response = function(response) {
        if (response) {
            var i, sid, uid, writable, is_multifolder, list, uid, list, uid;
            if (response.unlock && this.set_busy(!1, null, response.unlock),
            this.triggerEvent("responsebefore", {
                response: response
            }),
            this.triggerEvent("responsebefore" + response.action, {
                response: response
            }),
            response.env && this.set_env(response.env),
            "object" == typeof response.texts)
                for (i in response.texts)
                    "string" == typeof response.texts[i] && this.add_label(i, response.texts[i]);
            if (response.exec && eval(response.exec),
            response.callbacks && response.callbacks.length)
                for (i = 0; i < response.callbacks.length; i++)
                    this.triggerEvent(response.callbacks[i][0], response.callbacks[i][1]);
            switch (response.action) {
            case "mark":
                "show" != this.env.action && "preview" != this.env.action || "SEEN" != this.env.last_flag || this.set_unread_message(this.env.uid, this.env.mailbox);
                break;
            case "delete":
                "addressbook" == this.task && (uid = this.contact_list.get_selection(),
                writable = !1,
                uid && this.contact_list.rows[uid] && (writable = "" == this.env.source ? (sid = String(uid).replace(/^[^-]+-/, ""),
                sid && this.env.address_sources[sid] && !this.env.address_sources[sid].readonly) : !this.env.address_sources[this.env.source].readonly),
                this.enable_command("delete", "edit", writable),
                this.enable_command("export", this.contact_list && 0 < this.contact_list.rowcount),
                this.enable_command("export-selected", "print", !1));
            case "move":
                "show" == this.env.action ? (this.enable_command(this.env.message_commands, !0),
                this.env.list_post || this.enable_command("reply-list", !1)) : "addressbook" == this.task && this.triggerEvent("listupdate", {
                    list: this.contact_list,
                    folder: this.env.source,
                    rowcount: this.contact_list.rowcount
                });
            case "purge":
            case "expunge":
                "mail" == this.task && (this.env.exists || (this.env.contentframe && this.show_contentframe(!1),
                this.enable_command(this.env.message_commands, "purge", "expunge", "select-all", "select-none", "expand-all", "expand-unread", "collapse-all", !1)),
                this.message_list && this.triggerEvent("listupdate", {
                    list: this.message_list,
                    folder: this.env.mailbox,
                    rowcount: this.message_list.rowcount
                }));
                break;
            case "refresh":
            case "check-recent":
                $.each(this.env.recent_flags || {}, function(e, t) {
                    ref.set_message(e, "deleted", t.deleted),
                    ref.set_message(e, "replied", t.answered),
                    ref.set_message(e, "unread", !t.seen),
                    ref.set_message(e, "forwarded", t.forwarded),
                    ref.set_message(e, "flagged", t.flagged)
                }),
                delete this.env.recent_flags;
            case "getunread":
            case "search":
                this.env.qsearch = null;
            case "list":
                "mail" == this.task ? (is_multifolder = this.is_multifolder_listing(),
                list = this.message_list,
                uid = this.env.list_uid,
                this.enable_command("show", "select-all", "select-none", 0 < this.env.messagecount),
                this.enable_command("expunge", "purge", this.env.exists && !is_multifolder),
                this.enable_command("import-messages", !is_multifolder),
                this.enable_command("expand-all", "expand-unread", "collapse-all", this.env.threading && this.env.messagecount && !is_multifolder),
                list && ("list" != response.action && "search" != response.action || (uid && ("FIRST" === uid ? uid = list.get_first_row() : "LAST" === uid ? uid = list.get_last_row() : list.rows[uid] || (uid += "-" + this.env.mailbox),
                uid && list.rows[uid] && list.select(uid),
                delete this.env.list_uid),
                this.enable_command("set-listmode", this.env.threads && !is_multifolder),
                0 < list.rowcount && !$(document.activeElement).is("input,textarea") && list.focus(),
                list.triggerEvent("select")),
                "getunread" != response.action && this.triggerEvent("listupdate", {
                    list: list,
                    folder: this.env.mailbox,
                    rowcount: list.rowcount
                }))) : "addressbook" == this.task && (list = this.contact_list,
                uid = this.env.list_uid,
                this.enable_command("export", "select-all", "select-none", list && 0 < list.rowcount),
                "list" != response.action && "search" != response.action || (this.enable_command("search-create", "" == this.env.source),
                this.enable_command("search-delete", this.env.search_id),
                this.update_group_commands(),
                list && uid && ("FIRST" === uid ? uid = list.get_first_row() : "LAST" === uid && (uid = list.get_last_row()),
                uid && list.rows[uid] && list.select(uid),
                delete this.env.list_uid,
                list.triggerEvent("select")),
                0 < list.rowcount && !$(document.activeElement).is("input,textarea") && list.focus(),
                this.triggerEvent("listupdate", {
                    list: list,
                    folder: this.env.source,
                    rowcount: list.rowcount
                })));
                break;
            case "list-contacts":
            case "search-contacts":
                this.contact_list && (0 < this.contact_list.rowcount && this.contact_list.focus(),
                this.triggerEvent("listupdate", {
                    list: this.contact_list,
                    rowcount: this.contact_list.rowcount
                }))
            }
            response.unlock && this.hide_message(response.unlock),
            this.triggerEvent("responseafter", {
                response: response
            }),
            this.triggerEvent("responseafter" + response.action, {
                response: response
            }),
            this.start_keepalive()
        }
    }
    ,
    this.http_error = function(e, t, s, i, n) {
        var a = e.statusText;
        this.set_busy(!1, null, i),
        e.abort(),
        this.unload || (e.status && a ? this.display_message(this.get_label("servererror") + " (" + a + ")", "error") : "timeout" == t ? this.display_message("requesttimedout", "error") : 0 == e.status && "abort" != t && this.display_message("connerror", "error"),
        (t = e.getResponseHeader("Location")) && "compose" != this.env.action && this.redirect(t),
        403 != e.status ? "keep-alive" == n && setTimeout(function() {
            ref.keep_alive(),
            ref.start_keepalive()
        }, 3e4) : (this.is_framed() ? parent : window).location.reload())
    }
    ,
    this.session_error = function(e) {
        this.env.server_error = 401,
        "compose" == this.env.action ? (this.save_compose_form_local(),
        this.compose_skip_unsavedcheck = !0,
        this.env.session_lifetime = 0,
        this._keepalive && clearInterval(this._keepalive),
        this._refresh && clearInterval(this._refresh)) : e && setTimeout(function() {
            ref.redirect(e, !0)
        }, 2e3)
    }
    ,
    this.iframe_loaded = function(e) {
        e = e || this.env.frame_lock,
        this.set_busy(!1, null, e),
        this.submit_timer && clearTimeout(this.submit_timer)
    }
    ,
    this.multi_thread_http_request = function(e) {
        var t, s, i = (new Date).getTime(), n = e.threads || 1;
        for (e.reqid = i,
        e.running = 0,
        e.requests = [],
        e.result = [],
        e._items = $.extend([], e.items),
        e.lock || (e.lock = this.display_message("", "loading")),
        this.http_request_jobs[i] = e,
        t = 0; t < n && void 0 !== (s = e._items.shift()); t++)
            e.running++,
            e.requests.push(this.multi_thread_send_request(e, s));
        return i
    }
    ,
    this.multi_thread_send_request = function(e, t) {
        var s, i, n;
        if (e.postdata) {
            for (s in i = {},
            e.postdata)
                i[s] = String(e.postdata[s]).replace("%s", t);
            i._reqid = e.reqid
        } else if ("string" == typeof e.query)
            n = e.query.replace("%s", t),
            n += "&_reqid=" + e.reqid;
        else if ("object" == typeof e.query && e.query) {
            for (s in n = {},
            e.query)
                n[s] = String(e.query[s]).replace("%s", t);
            n._reqid = e.reqid
        }
        return i ? this.http_post(e.action, i) : this.http_request(e.action, n)
    }
    ,
    this.multi_thread_http_response = function(e, t) {
        var s = this.http_request_jobs[t];
        !s || s.running <= 0 || s.cancelled || (s.running--,
        s.onresponse && "function" == typeof s.onresponse && s.onresponse(e),
        s.result = $.extend(s.result, e),
        void 0 !== (e = s._items.shift()) ? (s.running++,
        s.requests.push(this.multi_thread_send_request(s, e))) : 0 == s.running && (s.whendone && "function" == typeof s.whendone && s.whendone(s.result),
        this.set_busy(!1, "", s.lock),
        delete this.http_request_jobs[t]))
    }
    ,
    this.multi_thread_request_abort = function(e) {
        var t = this.http_request_jobs[e];
        if (t) {
            for (var s = 0; 0 < t.running && s < t.requests.length; s++)
                t.requests[s].abort && t.requests[s].abort();
            t.running = 0,
            t.cancelled = !0,
            this.set_busy(!1, "", t.lock)
        }
    }
    ,
    this.async_upload_form = function(e, t, s) {
        var i = (new Date).getTime()
          , n = "rcmupload" + i;
        return this.dummy_iframe(n).on("load", {
            ts: i
        }, s),
        $(e).attr({
            target: n,
            action: this.url(t, {
                _id: this.env.compose_id || "",
                _uploadid: i,
                _from: this.env.action
            }),
            method: "POST",
            enctype: "multipart/form-data"
        }).submit(),
        n
    }
    ,
    this.dummy_iframe = function(e, t) {
        return $("<iframe>").attr({
            name: e,
            src: t,
            style: "width:0;height:0;visibility:hidden",
            "aria-hidden": "true"
        }).appendTo(document.body)
    }
    ,
    this.document_drag_hover = function(e, t) {
        $(this.gui_objects.filedrop)[t ? "addClass" : "removeClass"]("active")
    }
    ,
    this.file_drag_hover = function(e, t) {
        e.preventDefault(),
        e.stopPropagation(),
        $(this.gui_objects.filedrop)[t ? "addClass" : "removeClass"]("hover")
    }
    ,
    this.file_dropped = function(e) {
        this.file_drag_hover(e, !1);
        var t, s = e.target.files || e.dataTransfer.files, i = {
            _id: this.env.compose_id || this.env.cid || "",
            _remote: 1,
            _from: this.env.action
        };
        s && s.length ? this.file_upload(s, i, {
            name: (this.env.filedrop.fieldname || "_file") + (this.env.filedrop.single ? "" : "[]"),
            single: this.env.filedrop.single,
            filter: this.env.filedrop.filter,
            action: ref.env.filedrop.action
        }) : (t = e.dataTransfer.getData("roundcube-uri")) && (s = "upload" + (new Date).getTime(),
        e = $("<span>").text(e.dataTransfer.getData("roundcube-name") || this.get_label("attaching")).html(),
        i._uri = t,
        i._uploadid = s,
        this.add2attachment_list(s, {
            name: "",
            html: e,
            classname: "uploading",
            complete: !1
        }) || (this.file_upload_id = this.set_busy(!0, "attaching")),
        this.http_post(this.env.filedrop.action || "upload", i))
    }
    ,
    this.file_upload = function(e, t, i) {
        if (!window.FormData || !e || !e.length)
            return !1;
        var s, n, a, r = 0, o = 0, l = new FormData, c = i.name || "_file[]", h = i.single ? 1 : e.length;
        for (args = $.extend({
            _remote: 1,
            _from: this.env.action
        }, t || {}),
        n = 0; o < h && (s = e[n]); n++)
            i.filter && !s.type.match(new RegExp(i.filter)) || (l.append(c, s),
            r += s.size,
            a = s.name,
            o++);
        if (o) {
            if (this.env.max_filesize && this.env.filesizeerror && r > this.env.max_filesize)
                return this.display_message(this.env.filesizeerror, "error"),
                !1;
            if (this.env.max_filecount && this.env.filecounterror && o > this.env.max_filecount)
                return this.display_message(this.env.filecounterror, "error"),
                !1;
            var d = "upload" + (new Date).getTime()
              , t = 1 < o ? this.get_label("uploadingmany") : a
              , t = $("<span>").text(t).html();
            this.add2attachment_list(d, {
                name: "",
                html: t,
                classname: "uploading",
                complete: !1
            }) || i.lock || (i.lock = this.file_upload_id = this.set_busy(!0, "uploading")),
            args._uploadid = d,
            args._unlock = i.lock,
            this.uploads[d] = $.ajax({
                type: "POST",
                dataType: "json",
                url: this.url(i.action || "upload", args),
                contentType: !1,
                processData: !1,
                timeout: this.uploadTimeout,
                data: l,
                headers: {
                    "X-Roundcube-Request": this.env.request_token
                },
                xhr: function() {
                    var e = $.ajaxSettings.xhr();
                    return e.upload && ref.labels.uploadprogress && (e.upload.onprogress = function(e) {
                        e = ref.file_upload_msg(e.loaded, e.total);
                        e && $("#" + d).find(".uploading").text(e)
                    }
                    ),
                    e
                },
                success: function(e) {
                    delete ref.uploads[d],
                    ref.http_response(e)
                },
                error: function(e, t, s) {
                    delete ref.uploads[d],
                    ref.remove_from_attachment_list(d),
                    ref.http_error(e, t, s, i.lock, "attachment")
                }
            })
        }
        return !0
    }
    ,
    this.file_upload_msg = function(e, t) {
        if (t && e < t) {
            var s = Math.round(e / t * 100)
              , i = ref.get_label("uploadprogress");
            return 1073741824 <= t ? (t = parseFloat(t / 1073741824).toFixed(1) + " ".this.get_label("GB"),
            e = parseFloat(e / 1073741824).toFixed(1)) : 1048576 <= t ? (t = parseFloat(t / 1048576).toFixed(1) + " " + this.get_label("MB"),
            e = parseFloat(e / 1048576).toFixed(1)) : 1024 <= t ? (t = parseInt(t / 1024) + " " + this.get_label("KB"),
            e = parseInt(e / 1024)) : t = t + " " + this.get_label("B"),
            i.replace("$percent", s + "%").replace("$current", e).replace("$total", t)
        }
    }
    ,
    this.start_keepalive = function() {
        var e;
        !this.env.session_lifetime || this.env.framed || this.env.extwin || "login" == this.task || "print" == this.env.action || (this._keepalive && clearInterval(this._keepalive),
        e = .5 * Math.min(1800, this.env.session_lifetime) * 1e3,
        this._keepalive = setInterval(function() {
            ref.keep_alive()
        }, e < 3e4 ? 3e4 : e))
    }
    ,
    this.start_refresh = function() {
        !this.env.refresh_interval || this.env.framed || this.env.extwin || "login" == this.task || "print" == this.env.action || (this._refresh && clearInterval(this._refresh),
        this._refresh = setInterval(function() {
            ref.refresh()
        }, 1e3 * this.env.refresh_interval))
    }
    ,
    this.keep_alive = function() {
        this.busy || this.http_request("keep-alive")
    }
    ,
    this.refresh = function() {
        var e, t;
        this.busy ? setTimeout(function() {
            ref.refresh(),
            ref.start_refresh()
        }, 1e4) : (e = {},
        t = this.set_busy(!0, "refreshing"),
        (e = "mail" == this.task && this.gui_objects.mailboxlist ? this.check_recent_params() : e)._last = Math.floor(this.env.lastrefresh.getTime() / 1e3),
        this.env.lastrefresh = new Date,
        this.http_post("refresh", e, t))
    }
    ,
    this.check_recent_params = function() {
        var e = {
            _mbox: this.env.mailbox
        };
        return this.gui_objects.mailboxlist && (e._folderlist = 1),
        this.gui_objects.quotadisplay && (e._quota = 1),
        this.env.search_request && (e._search = this.env.search_request),
        this.gui_objects.messagelist && (e._list = 1,
        e._uids = $.map(this.message_list.rows, function(e, t) {
            return t
        }).join(",")),
        e
    }
    ,
    this.quote_html = function(e) {
        return String(e).replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    }
    ,
    this.opener = function(e, t) {
        var s, i = window.opener;
        try {
            if (i && !i.closed && i !== window) {
                if ((i = e && (!i.rcmail || i.rcmail.env.framed) && i.parent && i.parent.rcmail ? i.parent : i).rcmail && t)
                    for (s in t)
                        if (i.rcmail.env[s] != t[s])
                            return;
                return i.rcmail
            }
        } catch (e) {}
    }
    ,
    this.get_single_uid = function() {
        var e = this.env.uid || (this.message_list ? this.message_list.get_single_selection() : null);
        return ref.triggerEvent("get_single_uid", {
            uid: e
        }) || e
    }
    ,
    this.get_single_cid = function() {
        var e = this.env.cid || (this.contact_list ? this.contact_list.get_single_selection() : null);
        return ref.triggerEvent("get_single_cid", {
            cid: e
        }) || e
    }
    ,
    this.get_message_mailbox = function(e) {
        var t;
        return this.env.messages && e && (t = this.env.messages[e]) && t.mbox ? t.mbox : /^[0-9]+-(.*)$/.test(e) ? RegExp.$1 : this.env.mailbox
    }
    ,
    this.params_from_uid = function(e, t) {
        return (t = t || {})._uid = String(e).split("-")[0],
        t._mbox = this.get_message_mailbox(e),
        t
    }
    ,
    this.get_caret_pos = function(e) {
        return void 0 !== e.selectionEnd ? e.selectionEnd : e.value.length
    }
    ,
    this.set_caret_pos = function(e, t) {
        try {
            e.setSelectionRange && e.setSelectionRange(t, t)
        } catch (e) {}
    }
    ,
    this.get_input_selection = function(e) {
        var t = 0
          , s = 0
          , i = "";
        return "number" == typeof e.selectionStart && "number" == typeof e.selectionEnd && (i = e.value,
        t = e.selectionStart,
        s = e.selectionEnd),
        {
            start: t,
            end: s,
            text: i.substr(t, s - t)
        }
    }
    ,
    this.lock_form = function(e, t) {
        e && e.elements && (t && (this.disabled_form_elements = []),
        $.each(e.elements, function() {
            "hidden" != this.type && (t && this.disabled ? ref.disabled_form_elements.push(this) : (t || $.inArray(this, ref.disabled_form_elements) < 0) && (this.disabled = t))
        }))
    }
    ,
    this.mailto_handler_uri = function() {
        return location.href.split("?")[0] + "?_task=mail&_action=compose&_to=%s"
    }
    ,
    this.register_protocol_handler = function(e) {
        try {
            window.navigator.registerProtocolHandler("mailto", this.mailto_handler_uri(), e)
        } catch (e) {
            this.display_message(String(e), "error")
        }
    }
    ,
    this.check_protocol_handler = function(e, t) {
        var s = window.navigator;
        s && "function" == typeof s.registerProtocolHandler ? "function" == typeof s.isProtocolHandlerRegistered ? (s = s.isProtocolHandlerRegistered("mailto", this.mailto_handler_uri())) && $(t).parent().find(".mailtoprotohandler-status").html(s) : $(t).click(function() {
            return ref.register_protocol_handler(e),
            !1
        }) : $(t).addClass("disabled").click(function() {
            return ref.display_message("nosupporterror", "error"),
            !1
        })
    }
    ,
    this.browser_capabilities_check = function() {
        this.env.browser_capabilities || (this.env.browser_capabilities = {}),
        $.each(["pdf", "flash", "tiff", "webp", "pgpmime"], function() {
            void 0 === ref.env.browser_capabilities[this] && (ref.env.browser_capabilities[this] = ref[this + "_support_check"]())
        })
    }
    ,
    this.browser_capabilities = function() {
        if (!this.env.browser_capabilities)
            return "";
        var e, t = [];
        for (e in this.env.browser_capabilities)
            t.push(e + "=" + this.env.browser_capabilities[e]);
        return t.join()
    }
    ,
    this.tiff_support_check = function() {
        return this.image_support_check("tiff"),
        0
    }
    ,
    this.webp_support_check = function() {
        return this.image_support_check("webp"),
        0
    }
    ,
    this.image_support_check = function(t) {
        setTimeout(function() {
            var e = new Image;
            e.onload = function() {
                ref.env.browser_capabilities[t] = 1
            }
            ,
            e.onerror = function() {
                ref.env.browser_capabilities[t] = 0
            }
            ,
            e.src = ref.assets_path("program/resources/blank." + t)
        }, 10)
    }
    ,
    this.pdf_support_check = function() {
        if ("pdfViewerEnabled"in navigator)
            return navigator.pdfViewerEnabled ? 1 : 0;
        var e, t = navigator.mimeTypes ? navigator.mimeTypes["application/pdf"] : {}, s = /Adobe Reader|PDF|Acrobat/i;
        if (t && t.enabledPlugin)
            return 1;
        for (e in navigator.plugins)
            if ("string" == typeof (t = navigator.plugins[e])) {
                if (s.test(t))
                    return 1
            } else if (t.name && s.test(t.name))
                return 1;
        return setTimeout(function() {
            $("<object>").attr({
                data: ref.assets_path("program/resources/dummy.pdf"),
                type: "application/pdf",
                style: 'position: "absolute"; top: -1000px; height: 1px; width: 1px'
            }).on("load error", function(e) {
                ref.env.browser_capabilities.pdf = "load" == e.type ? 1 : 0;
                var t = this;
                setTimeout(function() {
                    $(t).remove()
                }, 10)
            }).appendTo(document.body)
        }, 10),
        0
    }
    ,
    this.flash_support_check = function() {
        var e = navigator.mimeTypes ? navigator.mimeTypes["application/x-shockwave-flash"] : {};
        if (e && e.enabledPlugin)
            return 1;
        if ("ActiveXObject"in window)
            try {
                if (e = new ActiveXObject("ShockwaveFlash.ShockwaveFlash"))
                    return 1
            } catch (e) {}
        return 0
    }
    ,
    this.pgpmime_support_check = function(e) {
        return window.mailvelope ? 1 : ($(window).on("mailvelope", function() {
            ref.env.browser_capabilities.pgpmime = 1
        }),
        0)
    }
    ,
    this.assets_path = function(e) {
        return e = this.env.assets_path && !e.startsWith(this.env.assets_path) ? this.env.assets_path + e : e
    }
    ,
    this.set_cookie = function(e, t, s) {
        !1 === s && (s = new Date).setYear(s.getFullYear() + 1),
        setCookie(e, t, s, this.env.cookie_path, this.env.cookie_domain, this.env.cookie_secure)
    }
    ,
    this.get_local_storage_prefix = function() {
        return this.local_storage_prefix || (this.local_storage_prefix = "roundcube." + (this.env.user_id || "anonymous") + "."),
        this.local_storage_prefix
    }
    ,
    this.local_storage_get_item = function(e, t, s) {
        var i, n;
        try {
            i = localStorage.getItem(this.get_local_storage_prefix() + e),
            n = JSON.parse(i)
        } catch (e) {}
        return n || t || null
    }
    ,
    this.local_storage_set_item = function(e, t, s) {
        try {
            return localStorage.setItem(this.get_local_storage_prefix() + e, JSON.stringify(t)),
            !0
        } catch (e) {
            return !1
        }
    }
    ,
    this.local_storage_remove_item = function(e) {
        try {
            return localStorage.removeItem(this.get_local_storage_prefix() + e),
            !0
        } catch (e) {
            return !1
        }
    }
    ,
    this.print_dialog = function() {
        setTimeout("window.print()", 10)
    }
}
rcube_webmail.long_subject_title = function(e, t, s) {
    e.title || (s = $(s || e)).width() + 15 * (t || 0) > s.parent().width() && (e.title = rcube_webmail.subject_text(s[0]))
}
,
rcube_webmail.long_subject_title_ex = function(e) {
    var t, s, i, n;
    e.title || (n = (t = $(e)).text().trim(),
    s = $("span.branch", t).width() || 0,
    n = (i = $("<span>").text(n).css({
        position: "absolute",
        float: "left",
        visibility: "hidden",
        "font-size": t.css("font-size"),
        "font-weight": t.css("font-weight")
    }).appendTo(document.body)).width(),
    i.remove(),
    n + 15 * s > t.width() && (e.title = rcube_webmail.subject_text(e)))
}
,
rcube_webmail.subject_text = function(e) {
    e = $(e).clone();
    return e.find(".skip-on-drag,.skip-content,.voice").remove(),
    e.text().trim()
}
,
rcube_webmail.set_iframe_events = function(t) {
    $("iframe").each(function() {
        var e = $(this);
        $.each(t, function(t, s) {
            e.on("load", function(e) {
                try {
                    $(this).contents().on(t, s)
                } catch (e) {}
            });
            try {
                e.contents().on(t, s)
            } catch (e) {}
        })
    })
}
,
rcube_webmail.prototype.get_cookie = getCookie,
rcube_webmail.prototype.addEventListener = rcube_event_engine.prototype.addEventListener,
rcube_webmail.prototype.removeEventListener = rcube_event_engine.prototype.removeEventListener,
rcube_webmail.prototype.triggerEvent = rcube_event_engine.prototype.triggerEvent;
