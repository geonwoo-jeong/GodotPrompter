# Native Class Binding (2D)

[Back](../SKILL.md). These are binding declarations, not a complete library: implement the declared methods and register GDExample in the entry point described in the common skill.

Header (`gdexample.h`):

```cpp
#pragma once
#include <godot_cpp/classes/sprite2d.hpp>

namespace godot {
class GDExample : public Sprite2D {
    GDCLASS(GDExample, Sprite2D)
private:
    double time_passed = 0.0;
    double amplitude = 10.0;
    double speed = 1.0;
protected:
    static void _bind_methods();
public:
    void _process(double delta) override;
    void set_amplitude(double p_amplitude);
    double get_amplitude() const;
    void set_speed(double p_speed);
    double get_speed() const;
};
}
```

Bindings (`gdexample.cpp` — `_bind_methods`):

```cpp
void GDExample::_bind_methods() {
    ClassDB::bind_method(D_METHOD("get_amplitude"), &GDExample::get_amplitude);
    ClassDB::bind_method(D_METHOD("set_amplitude", "p_amplitude"), &GDExample::set_amplitude);
    ADD_PROPERTY(PropertyInfo(Variant::FLOAT, "amplitude"), "set_amplitude", "get_amplitude");

    ClassDB::bind_method(D_METHOD("get_speed"), &GDExample::get_speed);
    ClassDB::bind_method(D_METHOD("set_speed", "p_speed"), &GDExample::set_speed);
    ADD_PROPERTY(PropertyInfo(Variant::FLOAT, "speed", PROPERTY_HINT_RANGE, "0,20,0.01"),
                 "set_speed", "get_speed");

    ADD_SIGNAL(MethodInfo("position_changed",
               PropertyInfo(Variant::OBJECT, "node"),
               PropertyInfo(Variant::VECTOR2, "new_pos")));
}
```

