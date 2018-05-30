<?php
use GraphQL\Type\Definition\ObjectType;
 use GraphQL\Type\Definition\ListOfType;
 use GraphQL\Type\Definition\Type;
function queryAll($type, $untranslatedFields, $translatedFields, $condition, $languages) {
  $fields = [];
  foreach ($untranslatedFields as $f) {
    $fields[] = "tbl_" . $type . "." . $f;
  };
  foreach ($translatedFields as $tf) {
    foreach ($languages as $lang) {
      $fields[] = $lang . "." . $tf . " AS " . $lang . "_" . $tf;
    };
  };
  $sql = "SELECT " . implode(",", $fields);
  $sql = "" . $sql . " FROM tbl_" . $type;
  if ($translatedFields) {
    foreach ($languages as $lang) {
      $sql = "" . $sql . " LEFT JOIN tbl_" . $type . "Translation AS " . $lang . " ON " . $lang . ".id = tbl_" . $type . ".id AND " . $lang . ".language = '" . $lang . "'";
    };
  };
  if ($condition) {
    $sql = "" . $sql . " WHERE " . $condition;
  };
  $command = Yii->app()->db->createCommand($sql);
  $rows = $command->queryAll();
  $result = [];
  foreach ($rows as $row) {
    $r = [];
    foreach ($untranslatedFields as $f) {
      $r[$f] = idx($row, $f);
    };
    foreach ($translatedFields as $f) {
      $r[$f] = null;
      foreach ($languages as $lang) {
        $val = idx($row, $lang . "_" . $f);
        if ($val !== null) {
          $r[$f] = $val;
          break;
        };
      };
    };
    $result[] = $r;
  };
  return $result;
};
class AppType extends ObjectType {
  public function __construct() {
    $appLoader = new BatchedLoader(function ($appIds, $emit) {
      // rows = queryAll('festival', ['id'], ['title'], 'id IN (' + implode(',', appIds) + ') AND status=2');
      foreach ($rows as $r) {
        if (!$r['title']) {
          exit($r['id']);
        };
        emit($r['id'], ["id" => $r['id'], "title" => $r['title']]);
      };
    }, false);
    /*    workLoader = new BatchedLoader(fn (array appIds, emit) {
      rows = queryAll('work', ['id', 'festivalId', 'taskName', 'result', 'requested', 'started', 'finished'], [], 'status = 2 AND festivalId IN (' + implode(',', appIds) + ')')
      foreach (rows as r) {
        emit(r['festivalId'], [id: r['id'], taskName: r['taskName'], status: r['result'], ts: r['finished']||r['started']||r['requested']])
      }
    }, false)

    favoriteLoader = new BatchedLoader(fn (array appIds, emit) {
      command = Yii::app().db.createCommand('SELECT festivalId FROM tbl_favoriteFestival WHERE userId=:userId')
      festivalIds = command.queryColumn([':userId': user().id])
      foreach (festivalIds as festivalId) {
        emit(festivalId, true)
      }
    }, true, false)
    childrenLoader = new BatchedLoader(fn (array appIds, emit) {
      rows = queryAll('festival', ['parentId', 'id'], ['title'], 'parentId IN (' + implode(',', appIds) + ') AND status > 0')
      foreach (rows as r) {
        emit(r['parentId'], [id: r['id'], title: r['title']])
      }
    })
    clientLoader = new BatchedLoader(fn (array appIds, emit) {
      rows = queryAll('client', ['id', 'festivalId', 'token', 'downloadUrl', 'version'], [], 'status = 2 AND festivalId IN (' + implode(',', appIds) + ')')
      foreach (rows as r) {
        emit(r['festivalId'], [id: r['id'], festivalId: r['festivalId'], platform: r['token'], downloadUrl: r['downloadUrl'], version: r['version']])
      }
    }, false)
    config = [name: 'App', description: 'An app in the system', fields: [id: Type::nonNull(Type::int()), title: Type::nonNull(Type::string()), favorited: [type: Type::boolean(), resolve: fn (app) {
      return favoriteLoader.load(app['id'])
    }], workItems: [type: new ListOfType(MEATypes::work()), resolve: fn (app) {
      return workLoader.load(app['id'])
    }], children: [type: new ListOfType(this), resolve: fn (app) {
      return childrenLoader.load(app['id'])
    }], clients: [type: new ListOfType(MEATypes::client()), resolve: fn (app) {
      return clientLoader.load(app['id'])
    }]]]
    parent::__construct(config)*/;
  }
  public function toJSON($f) {
    return ["id" => intval($f->id), "title" => $f->translate("title", "en")];
  }
}
?>