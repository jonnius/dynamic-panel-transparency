/* exported get_maximized_width_buffer, get_shell_version,validate, is_undef, clamp, is_maximized, match_colors, remove_file, get_file, write_to_file, get_app_for_window, get_app_for_wmclass, gdk_to_css_color, clutter_to_native_color, deep_freeze */

const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

/* Global Utility Variables */
const MAXIMIZED_WIDTH_BUFFER = 5;

/* Gnome Versioning */
const MAJOR_VERSION = parseInt(imports.misc.config.PACKAGE_VERSION.split('.')[0], 10);
const MINOR_VERSION = parseInt(imports.misc.config.PACKAGE_VERSION.split('.')[1], 10);

/* Permissions for created files. */
const PERMISSIONS_MODE = parseInt('0744', 8);

/* Utility Variable Access */

function get_maximized_width_buffer() {
    return MAXIMIZED_WIDTH_BUFFER;
}

function get_shell_version() {
    return { major: MAJOR_VERSION, minor: MINOR_VERSION };
}

/* Utility Functions */

function validate(a, b) {
    return (is_undef(a) === false ? a : b);
}

function is_undef(a) {
    return (typeof (a) === 'undefined' || a === null);
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function is_maximized(window) {
    let type = window.get_window_type();

    if (type === imports.gi.Meta.WindowType.DESKTOP) {
        return false;
    }

    if (window.maximized_vertically) {
        return true;
    }

    let frame = window.get_frame_rect();

    if (frame.y <= imports.ui.main.panel.actor.get_height()) {
        return (window.maximized_horizontally || frame.width >= (window.get_screen().get_size()[0] - MAXIMIZED_WIDTH_BUFFER));
    }

    return false;
}

function get_file(filename) {
    try {
        let file = Gio.file_new_for_path(filename);
        return file;
    } catch (error) {
        return null;
    }
}

function write_to_file(filename, text) {
    try {
        let file = get_file(filename);
        let parent = file.get_parent();

        if (GLib.mkdir_with_parents(parent.get_path(), PERMISSIONS_MODE) === 0) {
            let success = file.replace_contents(text, null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null, null);
            return success[0];
        }
    } catch (error) {
        log(error);
    }

    return false;
}

function remove_file(filename) {
    try {
        let file = get_file(filename);
        return file.delete(null);
    } catch (error) {
        log(error);
    }

    return false;
}

function get_app_for_window(window) {
    const Shell = imports.gi.Shell;

    let shell_app = Shell.WindowTracker.get_default().get_app_from_pid(window.get_pid());
    if (is_undef(shell_app))
        shell_app = Shell.AppSystem.get_default().lookup_startup_wmclass(window.get_wm_class());
    if (is_undef(shell_app))
        shell_app = Shell.AppSystem.get_default().lookup_desktop_wmclass(window.get_wm_class());
    return shell_app;
}

// TODO: alpha?
function gdk_to_css_color(color) {
    let red = Math.round(clamp((color.red * 255), 0, 255));
    let green = Math.round(clamp((color.green * 255), 0, 255));
    let blue = Math.round(clamp((color.blue * 255), 0, 255));

    return { 'red': red, 'green': green, 'blue': blue };
}

function clutter_to_native_color(color, alpha = false) {
    let output = {};
    output.red = color.red;
    output.green = color.green;
    output.blue = color.blue;
    if (alpha) {
        output.alpha = color.alpha;
    }
    return output;
}

function match_colors(a, b, alpha = false) {
    let result = (a.red === b.red);
    result = result && (a.green === b.green);
    result = result && (a.blue === b.blue);
    if (alpha) {
        result = result && (a.alpha === b.alpha);
    }
    return result;
}

function deep_freeze(type, recursive = false) {
    const freeze_children = function (obj) {
        Object.keys(obj).forEach(function (value, index, arr) {
            if (typeof (value) === 'object' && !Object.isFrozen(value)) {
                Object.freeze(value);
                if (recursive) {
                    freeze_children(value);
                }
            }
        });
    };
    Object.freeze(type);
    freeze_children(type);
}